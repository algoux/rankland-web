import type { Page, Request } from '@playwright/test';
import { expect, test } from './test';

const LIVE_UK = 'live-test-key';
const AUTH_HEADERS = {
  'x-token': 'rankland-e2e-auth',
  'x-producer-id': 'rankland-web-e2e',
};

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

    await page.goto(`/live/${LIVE_UK}?scrollSolution=1`);

    await expect(page).toHaveTitle(/Live: Test Contest 2024.*RankLand/, { timeout: 20_000 });
    const content = page.locator(
      `[data-id="live-ranklist-content"][data-ranklist-id="${LIVE_UK}"][data-row-count="2"]`,
    );
    await expect(content).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="live-scroll-solution-switch"]')).toBeVisible();
    await expect(page.getByRole('switch', { name: '实时滚动提交状态' })).toHaveAttribute(
      'data-state',
      'checked',
    );
    await expect(page.locator('[data-id="scroll-solution-container"]')).toHaveCSS('width', '320px');
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
    await expect(changeToast.locator('.result-change')).toHaveText('→');
    await expect(changeToast.locator('.result').nth(1)).toHaveText('AC');

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
