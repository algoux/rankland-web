import type { Page } from '@playwright/test';
import type * as srk from '@algoux/standard-ranklist';
import {
  filterSolutionsUntil,
  getSortedCalculatedRawSolutions,
  regenerateRanklistBySolutions,
} from '@algoux/standard-ranklist-utils';
import fixture from '../fixtures/ccpc26.srk.json';
import { expect, test } from './test';
import { stubWebSocket } from './helpers/browser';

const minute = 60_000;
const contestStart = Date.parse(fixture.contest.startAt);

function ranklistAt(minutes: number) {
  const data = structuredClone(fixture) as srk.Ranklist;
  return regenerateRanklistBySolutions(
    data,
    filterSolutionsUntil(getSortedCalculatedRawSolutions(data.rows), [minutes, 'min']),
  );
}

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    localStorage.setItem('StyledRanklistSettings', JSON.stringify({ professionalMode: true }));
  });
  await stubWebSocket(page);
}

async function openStatic(page: Page, ordinary = false) {
  await preparePage(page);
  await page.goto(`/ranklist/${ordinary ? 'ccpc26-ordinary-key' : 'ccpc26-key'}`);
  await expect(page.locator('.srk-main tbody tr')).toHaveCount(3);
  await expect(page.getByRole('slider', { name: 'Time Travel' })).toBeVisible();
}

async function openLive(page: Page, snapshot: () => srk.Ranklist, ordinary = false) {
  const key = ordinary ? 'ccpc26-live-ordinary-test' : 'ccpc26-live-test';
  const runtimeProblems: string[] = [];
  page.on('pageerror', (error) => runtimeProblems.push(error.message));
  page.on('console', (message) => {
    if (/hydration|mismatch|Cannot read properties/i.test(message.text())) runtimeProblems.push(message.text());
  });
  await preparePage(page);
  await page.route((url) => url.pathname === `/ranking/config/${key}`, (route) => route.fulfill({
    json: {
      code: 0,
      message: 'success',
      data: {
        id: key,
        uniqueKey: key,
        ...fixture.contest,
      },
    },
  }));
  let requests = 0;
  await page.route((url) => url.pathname === `/ranking/${key}`, (route) => {
    requests += 1;
    return route.fulfill({ json: { code: 0, message: 'success', data: snapshot() } });
  });
  await page.goto(`/live/${key}`);
  await expect(page.locator('.srk-main tbody tr')).toHaveCount(3);
  await expect(page.getByRole('slider', { name: 'Time Travel' })).toBeVisible();
  expect(runtimeProblems).toEqual([]);
  return () => requests;
}

function problemHeaders(page: Page) {
  return page.locator('.srk-main thead .srk-problem-header');
}

async function expectProblemAliases(page: Page, aliases: string[]) {
  await expect.poll(() => problemHeaders(page).evaluateAll((cells) => cells.map(
    (cell) => cell.querySelector('span')?.textContent || '',
  ))).toEqual(aliases);
  await expect.poll(() => page.locator('.srk-problem-statistics-footer-problem-header').evaluateAll(
    (cells) => cells.map((cell) => cell.querySelector('span')?.textContent || ''),
  )).toEqual(aliases);
  await expect.poll(() => page.locator('.srk-problem-statistics-footer-row').evaluateAll(
    (rows, displayedAliases) => rows.every((row) => Array.from(row.querySelectorAll(
      '.srk-problem-statistics-footer-cell:not(.srk-extra-statistics-footer-cell)',
    )).every((cell, index) => displayedAliases[index] !== '' || (
      cell.textContent?.trim() === '' && !cell.querySelector('a, [title], [data-tooltip]')
    ))),
    aliases,
  )).toBe(true);
}

function alphaProblemCells(page: Page) {
  return page.locator('.srk-main tbody tr').filter({ hasText: 'Team Alpha' })
    .locator('.srk-prest-status-block, .srk-status-placeholder-cell');
}

async function replayAt(page: Page, minutes: number) {
  const slider = page.getByRole('slider', { name: 'Time Travel' });
  await slider.press('Home');
  for (let value = 0; value < minutes; value += 1) await slider.press('ArrowRight');
  await expect(slider).toHaveValue(String(minutes));
}

// A modal traps focus. Emit the slider's actual input/commit events to change
// the snapshot while it is open and exercise removal of its animation cache.
async function replayWhileModalOpen(page: Page, minutes: number) {
  const slider = page.getByRole('slider', { name: 'Time Travel' });
  await slider.dispatchEvent('mousedown');
  await slider.evaluate((input: HTMLInputElement, value) => {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, minutes);
  await slider.dispatchEvent('mouseup');
  await expect(slider).toHaveValue(String(minutes));
}

async function expectAnonymousSolutions(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Solutions (Team Alpha)', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.srk-solution-result-text')).toHaveText(['Accepted']);
  await expect(dialog.locator('.srk-solution-result-text')).toHaveClass(/srk-preset-result-ac/);
  await expect(dialog).not.toContainText(/First Blood|FB/);
  await expect(dialog).not.toContainText('Beta Problem');
  await expect(page.getByText('Solutions of B (Team Alpha)', { exact: true })).toHaveCount(0);
}

async function expectRevealedBSolutions(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Solutions of B (Team Alpha)', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.srk-solution-result-text')).toHaveText(['First Blood']);
  await expect(dialog.locator('.srk-solution-result-text')).toHaveClass(/srk-preset-result-fb/);
}

async function closeAnonymousSolutions(page: Page) {
  const samples = await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true })
    .evaluate(async (button: HTMLButtonElement) => {
      const states: Array<{ state: string | null; title: string | null; results: string[] }> = [];
      const record = () => {
        const modal = document.querySelector('.srk-solutions-modal');
        states.push({
          state: modal?.closest('[data-srk-modal-state]')?.getAttribute('data-srk-modal-state') ?? null,
          title: modal?.querySelector('.srk-modal-title')?.textContent ?? null,
          results: Array.from(modal?.querySelectorAll('.srk-solution-result-text') ?? [])
            .map((result) => result.textContent?.trim() || ''),
        });
        return modal;
      };
      let observer: MutationObserver;
      const closed = new Promise<void>((resolve) => {
        observer = new MutationObserver(() => {
          if (!record()) resolve();
        });
        observer.observe(document.body, { attributes: true, childList: true, characterData: true, subtree: true });
      });
      record();
      button.click();
      await closed;
      observer!.disconnect();
      return states;
    });
  expect(samples.some((sample) => sample.state === 'closing')).toBe(true);
  expect(samples.every((sample) => sample.title === null || sample.title === 'Solutions (Team Alpha)')).toBe(true);
  expect(samples.every((sample) => sample.results.every((result) => result === 'Accepted'))).toBe(true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test.describe('CCPC26 presentation', () => {
  test('replay hides problem headers while keeping anonymous submission details clickable', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date(contestStart + 11 * minute));
    await openStatic(page);
    await expectProblemAliases(page, ['A', 'B', 'C']);
    await replayAt(page, 4);
    await expectProblemAliases(page, ['A', '', '']);
    await expect(page.getByText('Time Travel Mode', { exact: true })).toBeVisible();
    await expect(problemHeaders(page).nth(1)).toHaveText('');
    await expect(problemHeaders(page).nth(1)).not.toHaveAttribute('style');
    await expect(problemHeaders(page).nth(1)).not.toHaveAttribute('title');
    await expect(problemHeaders(page).nth(1).locator('[title], a')).toHaveCount(0);
    await problemHeaders(page).nth(1).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.problem-modal')).toHaveCount(0);
    await page.locator('.srk-problem-statistics-footer-problem-header').nth(1).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(alphaProblemCells(page)).toHaveCount(3);
    await expect(alphaProblemCells(page).nth(1)).toHaveClass(/srk-prest-status-block-accepted/);
    await expect(alphaProblemCells(page).nth(1)).not.toHaveClass(/srk-prest-status-block-fb/);
    await alphaProblemCells(page).nth(1).click();
    await expectAnonymousSolutions(page);
    await expect(page.locator('body')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: testInfo.outputPath('ccpc26-anonymous-solutions-desktop.png') });
    await closeAnonymousSolutions(page);
    await page.screenshot({ path: testInfo.outputPath('ccpc26-replay-desktop.png'), fullPage: true });

    await page.locator('.srk-main tbody tr').filter({ hasText: 'Team Alpha' })
      .getByText('Team Alpha', { exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Team Alpha', exact: true })).toBeVisible();
    await expect(page.locator('.user-modal canvas')).toHaveCount(0);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await problemHeaders(page).nth(0).click();
    await expect(page.getByRole('dialog', { name: 'Info of Problem A', exact: true })).toBeVisible();
    await expect(page.locator('.problem-modal-title')).toHaveText('Alpha Problem');
    await replayWhileModalOpen(page, 2);
    await expectProblemAliases(page, ['', '', '']);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.problem-modal')).toHaveCount(0);
    await expect(page.getByText('Info of Problem A', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Alpha Problem', { exact: true })).toHaveCount(0);

    await replayAt(page, 4);
    await alphaProblemCells(page).nth(0).click();
    await expect(page.getByRole('dialog', { name: 'Solutions of A (Team Alpha)', exact: true })).toBeVisible();
    await replayWhileModalOpen(page, 2);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Solutions of A (Team Alpha)', { exact: true })).toHaveCount(0);
    await replayAt(page, 0);
    await expectProblemAliases(page, ['', '', '']);
    await replayAt(page, 8);
    await expectProblemAliases(page, ['A', 'B', 'C']);
    await problemHeaders(page).nth(1).click();
    await expect(page.getByRole('dialog', { name: 'Info of Problem B', exact: true })).toBeVisible();
    await replayWhileModalOpen(page, 4);
    await expectProblemAliases(page, ['A', '', '']);
    await expect(page.locator('.problem-modal')).toHaveCount(0);
    await page.getByRole('slider', { name: 'Time Travel' }).press('End');
    await expectProblemAliases(page, ['A', 'B', 'C']);
    await expect(page.getByText('Time Travel Mode', { exact: true })).toHaveCount(0);
    await expect(alphaProblemCells(page).nth(1)).toHaveClass(/srk-prest-status-block-fb/);
    await alphaProblemCells(page).nth(1).click();
    await expectRevealedBSolutions(page);
    expect(errors).toEqual([]);
  });

  test('all three filters preserve the full contest reveal set', async ({ page }) => {
    await page.clock.setFixedTime(new Date(contestStart + 11 * minute));
    await openStatic(page);
    await replayAt(page, 4);
    await expectProblemAliases(page, ['A', '', '']);
    await page.locator('[data-id="ranklist-org-multi-select"]').click();
    await page.locator('[data-id="ranklist-org-option-North University"]').click();
    await page.locator('[data-id="ranklist-org-search"]').press('Escape');
    await expect(page.locator('.srk-main tbody tr')).toHaveCount(2);
    await expectProblemAliases(page, ['A', '', '']);

    const markerFilter = page.locator('[data-id="ranklist-marker-toggle-group"]');
    await markerFilter.getByRole('button', { name: 'Selected teams', exact: true }).click();
    await expect(page.locator('.srk-main tbody tr')).toHaveCount(1);
    await expectProblemAliases(page, ['A', '', '']);
    await markerFilter.getByRole('button', { name: '全部', exact: true }).click();
    const official = page.getByRole('switch', { name: '仅正式参赛' });
    await official.click();
    await expect(page.locator('.srk-main tbody tr')).toHaveCount(1);
    await expectProblemAliases(page, ['A', '', '']);
    await alphaProblemCells(page).nth(1).click();
    await expectAnonymousSolutions(page);
    await closeAnonymousSolutions(page);

    await replayAt(page, 6);
    await expect(page.locator('.srk-main tbody tr')).toHaveCount(1);
    // Gamma's accepted B still contributes when the unofficial team is filtered out.
    await expectProblemAliases(page, ['A', 'B', '']);
    await problemHeaders(page).nth(1).click();
    await expect(page.getByRole('dialog', { name: 'Info of Problem B', exact: true })).toBeVisible();
  });

  test('live crosses the exact freeze boundary without new submissions and replay takes priority', async ({ page }) => {
    const snapshot = ranklistAt(4);
    await page.clock.install({ time: new Date(contestStart + 4 * minute) });
    await openLive(page, () => snapshot);
    await expectProblemAliases(page, ['A', '', '']);
    await page.clock.pauseAt(new Date(contestStart + 8 * minute - 1000));
    await expectProblemAliases(page, ['A', '', '']);
    await page.clock.runFor(999);
    await expectProblemAliases(page, ['A', '', '']);
    await page.clock.runFor(1);
    await expectProblemAliases(page, ['A', 'B', 'C']);
    await replayAt(page, 4);
    await expectProblemAliases(page, ['A', '', '']);
    await page.clock.runFor(minute);
    await expectProblemAliases(page, ['A', '', '']);
    await page.getByRole('slider', { name: 'Time Travel' }).press('End');
    await expectProblemAliases(page, ['A', 'B', 'C']);
    await expect(page.getByText('Time Travel Mode', { exact: true })).toHaveCount(0);
  });

  test('live polling updates open submission privacy and preserves an i18n-title replay slider', async ({ page }) => {
    let latest = ranklistAt(4);
    await page.clock.install({ time: new Date(contestStart + 4 * minute) });
    const pollRequests = await openLive(page, () => latest);
    await expectProblemAliases(page, ['A', '', '']);
    await alphaProblemCells(page).nth(1).click();
    await expectAnonymousSolutions(page);
    await page.clock.pauseAt(new Date(contestStart + 6 * minute));
    const pollsBeforeUpdate = pollRequests();
    latest = ranklistAt(6);
    await page.clock.runFor(10_000);
    await expect.poll(pollRequests).toBeGreaterThan(pollsBeforeUpdate);
    await expectProblemAliases(page, ['A', 'B', '']);
    await expect(alphaProblemCells(page).nth(1)).toHaveClass(/srk-prest-status-block-fb/);
    await expectRevealedBSolutions(page);

    // The same open submission details follow revelation and later data correction.
    const pollsBeforeAnonymous = pollRequests();
    latest = ranklistAt(4);
    await page.clock.runFor(10_000);
    await expect.poll(pollRequests).toBeGreaterThan(pollsBeforeAnonymous);
    await expectProblemAliases(page, ['A', '', '']);
    await expectAnonymousSolutions(page);
    await page.clock.resume();
    await closeAnonymousSolutions(page);
    const pollsBeforeReveal = pollRequests();
    latest = ranklistAt(6);
    await page.clock.runFor(10_000);
    await expect.poll(pollRequests).toBeGreaterThan(pollsBeforeReveal);
    await expectProblemAliases(page, ['A', 'B', '']);

    await replayAt(page, 4);
    await expectProblemAliases(page, ['A', '', '']);
    const pollsBeforeReplay = pollRequests();
    await page.clock.runFor(10_000);
    await expect.poll(pollRequests).toBeGreaterThan(pollsBeforeReplay);
    await expect(page.getByRole('slider', { name: 'Time Travel' })).toHaveValue('4');
    await expectProblemAliases(page, ['A', '', '']);
    await page.clock.resume();
    await page.getByRole('slider', { name: 'Time Travel' }).press('End');
    await expectProblemAliases(page, ['A', 'B', '']);
    await alphaProblemCells(page).nth(1).click();
    await expectRevealedBSolutions(page);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await problemHeaders(page).nth(1).click();
    await expect(page.getByRole('dialog', { name: 'Info of Problem B', exact: true })).toBeVisible();
    const pollsBeforeCorrection = pollRequests();
    latest = ranklistAt(4);
    await page.clock.runFor(10_000);
    await expect.poll(pollRequests).toBeGreaterThan(pollsBeforeCorrection);
    await expectProblemAliases(page, ['A', '', '']);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.problem-modal')).toHaveCount(0);
    await expect(page.getByText('Info of Problem B', { exact: true })).toHaveCount(0);
    await problemHeaders(page).nth(1).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await alphaProblemCells(page).nth(1).click();
    await expectAnonymousSolutions(page);
  });

  test('mobile replay opens anonymous submissions without exposing the problem or FB', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.setFixedTime(new Date(contestStart + 11 * minute));
    await openStatic(page);
    await replayAt(page, 4);
    await expectProblemAliases(page, ['A', '', '']);
    await expect(alphaProblemCells(page)).toHaveCount(3);
    await problemHeaders(page).nth(1).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await alphaProblemCells(page).nth(1).click();
    await expectAnonymousSolutions(page);
    await expect(page.locator('body')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: testInfo.outputPath('ccpc26-anonymous-solutions-mobile.png') });
    await closeAnonymousSolutions(page);
    await page.screenshot({ path: testInfo.outputPath('ccpc26-replay-mobile.png'), fullPage: true });
  });

  for (const leavePage of [false, true]) {
    const transition = leavePage ? 'leaving the ranklist' : 'entering CCPC26';
    test(`${transition} cancels a pending user-curve worker without restarting calculations`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(contestStart + 11 * minute));
      await page.addInitScript(() => {
        const events: string[] = [];
        (window as unknown as { rankTimeWorkerEvents: string[] }).rankTimeWorkerEvents = events;
        class PendingWorker {
          onmessage: ((event: MessageEvent) => void) | null = null;
          onerror: ((event: ErrorEvent) => void) | null = null;
          constructor() {
            events.push('construct');
          }
          postMessage(message: { kind: string }) {
            events.push(message.kind);
            // Keep preparation unresolved while the user changes mode or leaves.
          }
          terminate() {
            events.push('terminate');
          }
        }
        window.Worker = PendingWorker as unknown as typeof Worker;
        window.requestIdleCallback = (callback) => window.setTimeout(
          () => callback({ didTimeout: false, timeRemaining: () => 50 }), 0,
        );
      });
      const workerEvents = () => page.evaluate(
        () => (window as unknown as { rankTimeWorkerEvents: string[] }).rankTimeWorkerEvents,
      );
      await openStatic(page, leavePage);
      await expect.poll(workerEvents).toContain('prepare');
      await page.locator('.srk-main tbody tr').filter({ hasText: 'Team Alpha' })
        .getByText('Team Alpha', { exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Team Alpha', exact: true })).toBeVisible();
      // The user selection is scheduled after a frame and now waits on prepare.
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(
        () => setTimeout(() => requestAnimationFrame(() => resolve()), 0),
      )));
      const before = await workerEvents();
      expect(before).not.toContain('select');
      if (leavePage) {
        const timeOrigin = await page.evaluate(() => performance.timeOrigin);
        await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await page.getByRole('link', { name: 'RankLand', exact: true }).click();
        await expect(page).toHaveURL(/\/$/);
        expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
        await expect(page.locator('.srk-main')).toHaveCount(0);
      } else {
        await replayWhileModalOpen(page, 4);
        await expectProblemAliases(page, ['A', '', '']);
        await expect(page.getByRole('dialog', { name: 'Team Alpha', exact: true })).toBeVisible();
        await expect(page.locator('.user-modal canvas')).toHaveCount(0);
      }
      await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
      expect((await workerEvents()).slice(before.length)).toEqual(['terminate']);
    });
  }

  for (const live of [false, true]) {
    test(`ordinary ICPC remains identified in ${live ? 'live' : 'static'} and replay modes`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(contestStart + (live ? 4 : 11) * minute));
      if (live) {
        const data = ranklistAt(4);
        data.sorter = { algorithm: 'ICPC', config: {} };
        await openLive(page, () => data, true);
      } else {
        await openStatic(page, true);
      }
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await replayAt(page, 2);
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await problemHeaders(page).nth(1).click();
      await expect(page.getByRole('dialog', { name: 'Info of Problem B', exact: true })).toBeVisible();
    });
  }
});
