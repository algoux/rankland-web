import type { Page, Request } from '@playwright/test';
import { expect, test } from './test';

const LIVE_UK = 'live-test-key';
const AUTH_HEADERS = {
  'x-token': 'rankland-e2e-auth',
  'x-producer-id': 'rankland-web-e2e',
};

function measureRegularScrollSolution(toast: Element) {
  const row = toast.querySelector('.scroll-solution-row')!;
  const scoreBox = row.querySelector('.score')!.getBoundingClientRect();
  const userBox = row.querySelector('.user')!.getBoundingClientRect();
  const problemBox = row.querySelector('.problem')!.getBoundingClientRect();
  const results = row.querySelectorAll('.result');
  const resultBox = results[results.length - 1].getBoundingClientRect();
  const toastBox = toast.getBoundingClientRect();
  const rowBox = row.getBoundingClientRect();
  const rowStyle = getComputedStyle(row);
  return {
    toastWidth: toastBox.width,
    rowWidth: rowBox.width,
    leftGap: scoreBox.left - toastBox.left,
    rightGap: toastBox.right - resultBox.right,
    scoreWidth: scoreBox.width,
    userWidth: userBox.width,
    problemWidth: problemBox.width,
    resultWidth: resultBox.width,
    resultLeft: resultBox.left - toastBox.left,
    userProblemGap: problemBox.left - userBox.right,
    problemResultGap: resultBox.left - problemBox.right,
    resultCount: results.length,
    paddingLeft: rowStyle.paddingLeft,
    paddingRight: rowStyle.paddingRight,
  };
}

function measureChangedScrollSolution(toast: Element) {
  const row = toast.querySelector('.scroll-solution-row')!;
  const scoreBox = row.querySelector('.score')!.getBoundingClientRect();
  const userBox = row.querySelector('.user')!.getBoundingClientRect();
  const problemBox = row.querySelector('.problem')!.getBoundingClientRect();
  const results = row.querySelectorAll('.result');
  const previousResultBox = results[0].getBoundingClientRect();
  const currentResultBox = results[1].getBoundingClientRect();
  const changeBox = row.querySelector('.result-change')!.getBoundingClientRect();
  const toastBox = toast.getBoundingClientRect();
  const rowBox = row.getBoundingClientRect();
  return {
    rowWidth: rowBox.width,
    scoreWidth: scoreBox.width,
    userWidth: userBox.width,
    problemWidth: problemBox.width,
    resultWidths: [previousResultBox.width, currentResultBox.width],
    changeWidth: changeBox.width,
    previousResultLeft: previousResultBox.left - toastBox.left,
    currentResultRightGap: toastBox.right - currentResultBox.right,
    userProblemGap: problemBox.left - userBox.right,
    problemPreviousResultGap: previousResultBox.left - problemBox.right,
    previousResultChangeGap: changeBox.left - previousResultBox.right,
    changeCurrentResultGap: currentResultBox.left - changeBox.right,
  };
}

function measureScrollSolutionDivider(row: Element) {
  const style = getComputedStyle(row, '::before');
  return {
    content: style.content,
    height: style.height,
    backgroundColor: style.backgroundColor,
  };
}

function measureBackgroundColor(element: Element) {
  return getComputedStyle(element).backgroundColor;
}

test.describe('/live/:id', () => {
  test('replays protobuf history, catches up from SSE, rolls results, and rebuilds after reset', async ({ page }) => {
    const requestUrls: string[] = [];
    const protobufEventRequests: Request[] = [];
    const websocketUrls: string[] = [];
    page.on('request', (request) => {
      requestUrls.push(request.url());
      if (request.resourceType() === 'websocket') {
        websocketUrls.push(request.url());
      }
      if (new URL(request.url()).pathname === `/api/v2/public/contests/${LIVE_UK}/events`) {
        protobufEventRequests.push(request);
      }
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`/live/${LIVE_UK}?scrollSolution=1`);

    await expect(page).toHaveTitle(/Live: Test Contest 2024.*RankLand/, { timeout: 20_000 });
    await expect(page.locator('html')).toHaveClass(/dark/);
    const content = page.locator(
      `[data-id="live-ranklist-content"][data-ranklist-id="${LIVE_UK}"][data-row-count="2"]`,
    );
    await expect(content).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="live-scroll-solution-switch"]')).toBeVisible();
    await expect(page.getByRole('switch', { name: '实时滚动提交状态' })).toHaveAttribute(
      'data-state',
      'checked',
    );
    const scrollSolution = page.locator('[data-id="scroll-solution-container"]');
    await expect(scrollSolution).toHaveCSS('left', '50px');
    await expect(scrollSolution).toHaveCSS('width', '320px');
    await expect(content).toHaveCSS('margin-left', '320px');
    await expect(page.locator('.plugin_scroll-solution-toast')).toHaveCount(0);

    const alphaRow = ranklistRow(page, 'Team Alpha');
    const betaRow = ranklistRow(page, 'Team Beta');
    await expect(alphaRow.locator('td').nth(2)).toHaveText('1');
    await expect(betaRow.locator('td').nth(2)).toHaveText('0');

    await appendEvents(page, 1, [
      {
        eventId: 5,
        type: 0,
        newSolutionData: {
          solutionId: 103,
          userId: 'team-beta',
          problemAlias: 'B',
          time: { value: '1800', unit: 0 },
        },
      },
      {
        eventId: 6,
        type: 2,
        solutionOnResultSettleData: {
          solutionId: 103,
          result: 5,
          time: { value: '1801', unit: 0 },
        },
      },
    ]);
    const settleToast = page.locator('.plugin_scroll-solution-toast').filter({
      has: page.locator('.problem', { hasText: 'B' }),
    }).filter({ hasText: 'Team Beta' });
    await expect(settleToast).toContainText('FB', { timeout: 20_000 });
    await expect(settleToast).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(settleToast).toHaveCSS('color', 'rgb(223, 223, 233)');
    await expect(settleToast.locator('.user-second-name')).toHaveCSS('color', 'rgb(165, 165, 165)');
    const settleRow = settleToast.locator('.scroll-solution-row');
    await expect(settleRow).toHaveCSS('background-color', 'rgb(39, 39, 39)');
    const toastLayout = await settleToast.evaluate(measureRegularScrollSolution);
    expect(toastLayout).toMatchObject({
      resultCount: 1,
      paddingLeft: '0px',
      paddingRight: '0px',
    });
    expect(toastLayout.toastWidth).toBeCloseTo(320, 4);
    expect(toastLayout.leftGap).toBeCloseTo(0, 4);
    expect(toastLayout.rightGap).toBeCloseTo(70, 4);
    expect(toastLayout.rowWidth).toBeCloseTo(250, 4);
    expect(toastLayout.scoreWidth).toBeCloseTo(40, 4);
    expect(toastLayout.userWidth).toBeCloseTo(125, 4);
    expect(toastLayout.problemWidth).toBeCloseTo(40, 4);
    expect(toastLayout.resultWidth).toBeCloseTo(45, 4);
    expect(toastLayout.resultLeft).toBeCloseTo(205, 4);
    expect(toastLayout.userProblemGap).toBeCloseTo(0, 4);
    expect(toastLayout.problemResultGap).toBeCloseTo(0, 4);

    await appendEvents(page, 1, [
      {
        eventId: 7,
        type: 0,
        newSolutionData: {
          solutionId: 104,
          userId: 'team-alpha',
          problemAlias: 'B',
          time: { value: '15000', unit: 0 },
        },
      },
    ]);
    const frozenToast = page.locator('.plugin_scroll-solution-toast').filter({
      hasText: 'Team Alpha',
    });
    await expect(frozenToast).toContainText('?', { timeout: 20_000 });
    const frozenRow = frozenToast.locator('.scroll-solution-row');
    expect(await settleRow.evaluate(measureScrollSolutionDivider)).toMatchObject({
      content: 'none',
    });
    const darkBodyBackground = await page.locator('body').evaluate(measureBackgroundColor);
    expect(await frozenRow.evaluate(measureScrollSolutionDivider)).toEqual({
      content: '\"\"',
      height: '1px',
      backgroundColor: darkBodyBackground,
    });

    await appendEvents(page, 1, [
      {
        eventId: 8,
        type: 3,
        solutionOnResultChangeData: {
          solutionId: 102,
          previousResult: 8,
          result: 5,
          time: { value: '1202', unit: 0 },
        },
      },
    ]);
    const changeToast = page.locator('.plugin_scroll-solution-toast').filter({
      has: page.locator('.problem', { hasText: 'A' }),
    });
    await expect(changeToast.locator('.result')).toHaveCount(2);
    await expect(changeToast.locator('.result').nth(0)).toHaveText('WA');
    await expect(changeToast.locator('.result').nth(0)).toHaveCSS('background-color', 'rgb(160, 42, 39)');
    await expect(changeToast.locator('.result-change')).toHaveText('→');
    await expect(changeToast.locator('.result').nth(1)).toHaveText('AC');
    await expect(changeToast.locator('.result').nth(1)).toHaveCSS('background-color', 'rgb(31, 132, 31)');
    const changeLayout = await changeToast.evaluate(measureChangedScrollSolution);
    expect(changeLayout.rowWidth).toBeCloseTo(320, 4);
    expect(changeLayout.scoreWidth).toBeCloseTo(40, 4);
    expect(changeLayout.userWidth).toBeCloseTo(125, 4);
    expect(changeLayout.problemWidth).toBeCloseTo(40, 4);
    expect(changeLayout.resultWidths[0]).toBeCloseTo(45, 4);
    expect(changeLayout.resultWidths[1]).toBeCloseTo(45, 4);
    expect(changeLayout.changeWidth).toBeCloseTo(25, 4);
    expect(changeLayout.previousResultLeft).toBeCloseTo(205, 4);
    expect(changeLayout.currentResultRightGap).toBeCloseTo(0, 4);
    expect(changeLayout.userProblemGap).toBeCloseTo(0, 4);
    expect(changeLayout.problemPreviousResultGap).toBeCloseTo(0, 4);
    expect(changeLayout.previousResultChangeGap).toBeCloseTo(0, 4);
    expect(changeLayout.changeCurrentResultGap).toBeCloseTo(0, 4);

    await page.getByRole('button', { name: '主题模式' }).click();
    await page.locator('[data-id="theme-mode-menu"]').getByRole('menuitemradio', { name: /亮色/ }).click();
    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(settleRow).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(settleToast).toHaveCSS('color', 'rgb(51, 51, 51)');
    const lightBodyBackground = await page.locator('body').evaluate(measureBackgroundColor);
    expect(await frozenRow.evaluate(measureScrollSolutionDivider)).toMatchObject({
      backgroundColor: lightBodyBackground,
    });

    await resetEvents(page);
    await expect(page.locator('.plugin_scroll-solution-toast')).toHaveCount(0, { timeout: 20_000 });
    await appendEvents(page, 2, [
      {
        eventId: 1,
        type: 0,
        newSolutionData: {
          solutionId: 201,
          userId: 'team-beta',
          problemAlias: 'A',
          time: { value: '300', unit: 0 },
        },
      },
      {
        eventId: 2,
        type: 2,
        solutionOnResultSettleData: {
          solutionId: 201,
          result: 5,
          time: { value: '301', unit: 0 },
        },
      },
    ]);
    await expect(alphaRow.locator('td').nth(2)).toHaveText('0', { timeout: 20_000 });
    await expect(betaRow.locator('td').nth(2)).toHaveText('1');

    expect(protobufEventRequests.length).toBeGreaterThanOrEqual(5);
    for (const request of protobufEventRequests) {
      expect((await request.allHeaders()).accept).toBe('application/protobuf');
      const url = new URL(request.url());
      expect(url.searchParams.get('compactProgress')).toBe('true');
      expect(url.searchParams.get('limit')).toBe('1000');
    }
    expect(requestUrls.some((url) => new URL(url).pathname.startsWith('/ranking/'))).toBe(false);
    expect(websocketUrls).toEqual([]);
  });
});

function ranklistRow(page: Page, userName: string) {
  return page.locator('.srk-ranklist-table-scroll tbody tr').filter({
    has: page.locator('.srk-user-name-text', { hasText: userName }),
  });
}

async function appendEvents(page: Page, streamRevision: number, events: unknown[]) {
  const response = await page.request.post(`/api/v2/contests/${LIVE_UK}/events`, {
    headers: AUTH_HEADERS,
    data: {
      streamRevision,
      events,
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
}

async function resetEvents(page: Page) {
  const response = await page.request.post(`/api/v2/contests/${LIVE_UK}/events/reset`, {
    headers: {
      'x-token': AUTH_HEADERS['x-token'],
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
}
