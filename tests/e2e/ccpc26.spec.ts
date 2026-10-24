import type { Page } from '@playwright/test';
import fixture from '../fixtures/ccpc26.srk.json';
import { expect, test } from './test';

const minute = 60_000;
const contestStart = Date.parse(fixture.contest.startAt);
const LIVE_AUTH_HEADERS = {
  'x-token': 'rankland-e2e-auth',
  'x-producer-id': 'rankland-web-e2e-ccpc26',
};

interface LiveEventSession {
  key: string;
  streamRevision: number;
  nextEventId: number;
}

function anonymousFooterCellsAreHidden(rows: Element[], displayedAliases: string[]) {
  for (const row of rows) {
    const cells = row.querySelectorAll(
      '.srk-problem-statistics-footer-cell:not(.srk-extra-statistics-footer-cell)',
    );
    for (const [index, cell] of Array.from(cells).entries()) {
      if (
        displayedAliases[index] === ''
        && (cell.textContent?.trim() !== '' || cell.querySelector('a, [title], [data-tooltip]'))
      ) {
        return false;
      }
    }
  }
  return true;
}

async function waitForAnimationTimerCycle() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function waitForMacrotask() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function preparePage(page: Page, initialPreferCCPC26?: boolean) {
  await page.addInitScript((preferCCPC26: boolean | null) => {
    localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    if (localStorage.getItem('StyledRanklistSettings') === null) {
      localStorage.setItem('StyledRanklistSettings', JSON.stringify({
        professionalMode: true,
        ...(preferCCPC26 === null ? {} : { preferCCPC26 }),
      }));
    }
  }, initialPreferCCPC26 ?? null);
}

async function openStatic(page: Page, ordinary = false) {
  await preparePage(page);
  await page.goto(`/ranklist/${ordinary ? 'ccpc26-ordinary-key' : 'ccpc26-key'}`);
  await expect(page.locator('.srk-main tbody tr')).toHaveCount(3);
  await expect(page.getByRole('slider', { name: 'Time Travel' })).toBeVisible();
}

async function openLive(
  page: Page,
  ordinary = false,
  initialPreferCCPC26?: boolean,
) {
  const key = ordinary ? 'ccpc26-live-ordinary-test' : 'ccpc26-live-test';
  const runtimeProblems: string[] = [];
  page.on('pageerror', (error) => runtimeProblems.push(error.message));
  page.on('console', (message) => {
    if (/hydration|mismatch|Cannot read properties/i.test(message.text())) runtimeProblems.push(message.text());
  });
  await preparePage(page, initialPreferCCPC26);
  const session = await resetLiveContest(page, key);
  await page.goto(`/live/${key}`);
  await expect(page.locator('.srk-main tbody tr')).toHaveCount(3);
  await expect(page.getByRole('slider', { name: 'Time Travel' })).toBeVisible();
  expect(runtimeProblems).toEqual([]);
  return session;
}

async function resetLiveContest(page: Page, key: string): Promise<LiveEventSession> {
  const resetResponse = await page.request.post(`/api/v2/contests/${key}/events/reset`, {
    headers: { 'x-token': LIVE_AUTH_HEADERS['x-token'] },
  });
  expect(resetResponse.ok(), await resetResponse.text()).toBe(true);

  const stateResponse = await page.request.get(`/api/v2/public/contests/${key}/event-stream`);
  expect(stateResponse.ok(), await stateResponse.text()).toBe(true);
  const stateBody = await stateResponse.json() as {
    data?: { streamRevision?: number };
  };
  const streamRevision = stateBody.data?.streamRevision;
  expect(streamRevision).toEqual(expect.any(Number));
  const session: LiveEventSession = {
    key,
    streamRevision: streamRevision!,
    nextEventId: 1,
  };
  await appendLiveEvents(page, session, createCcpc26InitialEvents());
  return session;
}

async function appendLiveEvents(
  page: Page,
  session: LiveEventSession,
  events: Array<Record<string, unknown>>,
) {
  const eventsWithIds = events.map((event, index) => ({
    eventId: session.nextEventId + index,
    ...event,
  }));
  const response = await page.request.post(`/api/v2/contests/${session.key}/events`, {
    headers: LIVE_AUTH_HEADERS,
    data: {
      streamRevision: session.streamRevision,
      events: eventsWithIds,
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  session.nextEventId += eventsWithIds.length;
}

function createCcpc26InitialEvents(): Array<Record<string, unknown>> {
  const solutions = [
    { solutionId: 201, userId: 'ccpc26-alpha', problemAlias: 'B', submittedAtSeconds: 60 },
    { solutionId: 202, userId: 'ccpc26-alpha', problemAlias: 'A', submittedAtSeconds: 120 },
    { solutionId: 203, userId: 'ccpc26-beta', problemAlias: 'A', submittedAtSeconds: 180 },
  ];
  return solutions.flatMap((solution) => [
    {
      type: 0,
      newSolutionData: {
        solutionId: solution.solutionId,
        userId: solution.userId,
        problemAlias: solution.problemAlias,
        time: { value: String(solution.submittedAtSeconds), unit: 0 },
      },
    },
    {
      type: 2,
      solutionOnResultSettleData: {
        solutionId: solution.solutionId,
        result: 5,
        time: { value: String(solution.submittedAtSeconds + 1), unit: 0 },
      },
    },
  ]);
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
    anonymousFooterCellsAreHidden,
    aliases,
  )).toBe(true);
}

async function expectCCPC26Preference(page: Page, enabled: boolean) {
  await expect.poll(() => page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('StyledRanklistSettings') || '{}');
    return settings.preferCCPC26;
  })).toBe(enabled);
}

async function expectCenteredReplayLabel(page: Page) {
  const label = page.locator('.srk-progress-time-machine-text');
  const switchLabel = page.locator('.srk-ranklist-ccpc26-switch');
  await expect(label).toBeVisible();
  await expect(switchLabel).toBeVisible();
  const [barBox, textBox, switchBox] = await Promise.all([
    page.locator('.srk-progress-bar').boundingBox(),
    label.boundingBox(),
    switchLabel.boundingBox(),
  ]);
  expect(barBox).not.toBeNull();
  expect(textBox).not.toBeNull();
  expect(switchBox).not.toBeNull();
  expect(Math.abs(textBox!.x + textBox!.width / 2 - barBox!.x - barBox!.width / 2))
    .toBeLessThanOrEqual(1);
  expect(switchBox!.x).toBeGreaterThanOrEqual(textBox!.x + textBox!.width);
  expect(switchBox!.x + switchBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const remainingBox = await page.locator('.srk-progress-secondary-area-right').boundingBox();
  expect(remainingBox).not.toBeNull();
  expect(remainingBox!.y >= switchBox!.y + switchBox!.height || remainingBox!.x >= switchBox!.x + switchBox!.width).toBe(true);
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
    await page.clock.install({ time: new Date(contestStart + 4 * minute) });
    await openLive(page);
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

  test('live SSE updates open submission privacy and preserves an i18n-title replay slider', async ({ page }) => {
    await page.clock.install({ time: new Date(contestStart + 4 * minute) });
    const session = await openLive(page);
    await expectProblemAliases(page, ['A', '', '']);
    await alphaProblemCells(page).nth(1).click();
    await expectAnonymousSolutions(page);
    await page.clock.pauseAt(new Date(contestStart + 6 * minute));
    await page.clock.resume();
    await appendLiveEvents(page, session, [
      {
        type: 0,
        newSolutionData: {
          solutionId: 204,
          userId: 'ccpc26-gamma',
          problemAlias: 'B',
          time: { value: '360', unit: 0 },
        },
      },
      {
        type: 2,
        solutionOnResultSettleData: {
          solutionId: 204,
          result: 5,
          time: { value: '361', unit: 0 },
        },
      },
    ]);
    await expectProblemAliases(page, ['A', 'B', '']);
    await expect(alphaProblemCells(page).nth(1)).toHaveClass(/srk-prest-status-block-fb/);
    await expectRevealedBSolutions(page);

    // The same open submission details follow revelation and later data correction.
    await appendLiveEvents(page, session, [
      {
        type: 3,
        solutionOnResultChangeData: {
          solutionId: 204,
          previousResult: 5,
          result: 2,
          time: { value: '362', unit: 0 },
        },
      },
    ]);
    await expectProblemAliases(page, ['A', '', '']);
    await expectAnonymousSolutions(page);
    await closeAnonymousSolutions(page);
    await appendLiveEvents(page, session, [
      {
        type: 3,
        solutionOnResultChangeData: {
          solutionId: 204,
          previousResult: 2,
          result: 5,
          time: { value: '363', unit: 0 },
        },
      },
    ]);
    await expectProblemAliases(page, ['A', 'B', '']);

    await replayAt(page, 4);
    await expectProblemAliases(page, ['A', '', '']);
    await appendLiveEvents(page, session, [
      {
        type: 2,
        solutionOnResultSettleData: {
          solutionId: 204,
          result: 5,
          time: { value: '364', unit: 0 },
        },
      },
    ]);
    await expect(page.getByRole('slider', { name: 'Time Travel' })).toHaveValue('4');
    await expectProblemAliases(page, ['A', '', '']);
    await page.getByRole('slider', { name: 'Time Travel' }).press('End');
    await expectProblemAliases(page, ['A', 'B', '']);
    await alphaProblemCells(page).nth(1).click();
    await expectRevealedBSolutions(page);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await problemHeaders(page).nth(1).click();
    await expect(page.getByRole('dialog', { name: 'Info of Problem B', exact: true })).toBeVisible();
    await appendLiveEvents(page, session, [
      {
        type: 3,
        solutionOnResultChangeData: {
          solutionId: 204,
          previousResult: 5,
          result: 2,
          time: { value: '365', unit: 0 },
        },
      },
    ]);
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
      await page.evaluate(waitForAnimationTimerCycle);
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
      await page.evaluate(waitForMacrotask);
      expect((await workerEvents()).slice(before.length)).toEqual(['terminate']);
    });
  }

  for (const { width, progressWidth } of [{ width: 1280 }, { width: 390 }, { width: 1280, progressWidth: 420 }]) {
    test(`CCPC26 preference persists through replay and reload at ${width}px${progressWidth ? ' in a narrow pane' : ''}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.clock.setFixedTime(new Date(contestStart + 11 * minute));
      await openStatic(page);
      async function constrainProgress() {
        if (progressWidth) {
          await page.locator('[data-id="ranklist-progress"]').evaluate((element, width) => {
            (element as HTMLElement).style.maxWidth = `${width}px`;
          }, progressWidth);
        }
      }
      await constrainProgress();
      const ccpc26 = page.getByRole('switch', { name: 'CCPC26', exact: true });
      await expect(ccpc26).toHaveCount(0);
      await replayAt(page, 4);
      await expect(ccpc26).toBeChecked();
      await expectProblemAliases(page, ['A', '', '']);
      await expectCenteredReplayLabel(page);
      await expect(page.locator('body')).toHaveCSS('opacity', '1');
      await page.screenshot({
        path: testInfo.outputPath(`ccpc26-preference-default-${width}.png`),
        fullPage: true,
      });

      await ccpc26.click();
      await expect(ccpc26).not.toBeChecked();
      await expect(page.getByRole('slider', { name: 'Time Travel' })).toHaveValue('4');
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await expectCenteredReplayLabel(page);
      await expectCCPC26Preference(page, false);
      for (const replayMinute of [0, 8, 6]) {
        await replayAt(page, replayMinute);
        await expect(ccpc26).not.toBeChecked();
        await expectProblemAliases(page, ['A', 'B', 'C']);
        await expectCCPC26Preference(page, false);
      }

      await page.reload();
      await expect(page.locator('.srk-main tbody tr')).toHaveCount(3);
      await expect(ccpc26).toHaveCount(0);
      await constrainProgress();
      await replayAt(page, 4);
      await expect(ccpc26).not.toBeChecked();
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await expectCCPC26Preference(page, false);
      await ccpc26.focus();
      await ccpc26.press('Space');
      await expect(ccpc26).toBeChecked();
      await expectProblemAliases(page, ['A', '', '']);
      await expectCCPC26Preference(page, true);

      await replayAt(page, 8);
      await expect(ccpc26).toBeChecked();
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await expectCCPC26Preference(page, true);
      await expectCenteredReplayLabel(page);
      await page.locator('[data-id="ranklist-progress"]').screenshot({
        path: testInfo.outputPath(`ccpc26-progress-frozen-${width}.png`),
      });
      await page.screenshot({
        path: testInfo.outputPath(`ccpc26-preference-frozen-${width}.png`),
        fullPage: true,
      });
      await replayAt(page, 4);
      await expect(ccpc26).toBeChecked();
      await expectProblemAliases(page, ['A', '', '']);
      await page.getByRole('slider', { name: 'Time Travel' }).press('End');
      await expect(ccpc26).toHaveCount(0);
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await expectCCPC26Preference(page, true);
    });
  }

  test('live honors the saved preference through replay, exit and reload without hydration errors', async ({ page }) => {
    const runtimeProblems: string[] = [];
    page.on('pageerror', (error) => runtimeProblems.push(error.message));
    page.on('console', (message) => {
      if (/hydration|mismatch|Cannot read properties/i.test(message.text())) runtimeProblems.push(message.text());
    });
    await page.clock.setFixedTime(new Date(contestStart + 4 * minute));
    await openLive(page, false, false);
    const ccpc26 = page.getByRole('switch', { name: 'CCPC26', exact: true });
    await expect(ccpc26).toHaveCount(0);
    await expectProblemAliases(page, ['A', 'B', 'C']);
    await expectCCPC26Preference(page, false);
    await replayAt(page, 2);
    await expect(ccpc26).not.toBeChecked();
    await expectProblemAliases(page, ['A', 'B', 'C']);
    await ccpc26.click();
    await expect(ccpc26).toBeChecked();
    await expectProblemAliases(page, ['', '', '']);
    await expectCCPC26Preference(page, true);
    await page.getByRole('slider', { name: 'Time Travel' }).press('End');
    await expect(ccpc26).toHaveCount(0);
    await expect(page.locator('.srk-progress-live-text')).toBeVisible();
    await expectProblemAliases(page, ['A', '', '']);
    await expectCCPC26Preference(page, true);

    await page.reload();
    await expect(page.locator('.srk-main tbody tr')).toHaveCount(3);
    await expect(ccpc26).toHaveCount(0);
    await expectProblemAliases(page, ['A', '', '']);
    await expectCCPC26Preference(page, true);
    expect(runtimeProblems).toEqual([]);
  });

  for (const live of [false, true]) {
    test(`ordinary ICPC remains identified in ${live ? 'live' : 'static'} and replay modes`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(contestStart + (live ? 4 : 11) * minute));
      if (live) {
        await openLive(page, true);
      } else {
        await openStatic(page, true);
      }
      await expect(page.getByRole('switch', { name: 'CCPC26', exact: true })).toHaveCount(0);
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await replayAt(page, 2);
      await expect(page.getByRole('switch', { name: 'CCPC26', exact: true })).toHaveCount(0);
      await expectProblemAliases(page, ['A', 'B', 'C']);
      await problemHeaders(page).nth(1).click();
      await expect(page.getByRole('dialog', { name: 'Info of Problem B', exact: true })).toBeVisible();
    });
  }
});
