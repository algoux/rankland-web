import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { denyExternalCalls, stubWebSocket } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function readRequests(request: APIRequestContext) {
  const response = await request.get(`${mockBaseURL}/__requests`);
  return (await response.json()) as Array<{ path: string; search: string }>;
}

function bytes(text: string) {
  return Array.from(new TextEncoder().encode(text));
}

function makeRealtimeSolutionBytes() {
  const fields = [
    [0, 0, 0, 0, 0, 0, 0, 7],
    bytes('A'),
    bytes('team-alpha'),
    bytes('AC'),
    [2],
  ];
  const header = [fields.length, ...fields.map((field) => field.length)];
  return [...header, ...fields.flat()];
}

test.describe('/live/:id full-chain route', () => {
  test('hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/live/live-test-key?token=t0&scrollSolution=1&focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Live: Test Contest 2024 - RankLand');
    await expect(
      page.locator(
        '[data-id="live-ranklist-content"][data-ranklist-id="live-test-key"][data-live-id="live-rid-1"][data-row-count="2"][data-focus="yes"]',
      ),
    ).toBeVisible();
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="live-scroll-solution-toggle"]')).toBeChecked();
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-extra-action"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('Powered by Standard Ranklist');
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeVisible();

    await page.selectOption('[data-id="rankland-ranklist-organization-filter"]', ['Org A']);
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeHidden();

    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __ranklandWsUrls?: string[] }).__ranklandWsUrls || []),
      )
      .toContain(`ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`);

    await page.evaluate(
      ({ url, message }) => {
        (
          window as unknown as {
            __ranklandEmitWsMessage?: (url: string, bytes: number[]) => void;
          }
        ).__ranklandEmitWsMessage?.(url, message);
      },
      {
        url: `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`,
        message: makeRealtimeSolutionBytes(),
      },
    );

    const scrollSolutionItem = page.locator('[data-id="live-scroll-solution-item"]').first();
    await expect(scrollSolutionItem).toContainText('2');
    await expect(scrollSolutionItem).toContainText('Team Alpha');
    await expect(scrollSolutionItem).toContainText('A');
    await expect(scrollSolutionItem).toContainText('AC');

    const requests = await readRequests(request);
    const liveInfoRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/config/live-test-key');
    const liveRanklistRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/live-rid-1');

    expect(liveInfoRequests).toHaveLength(1);
    expect(liveRanklistRequests.length).toBeGreaterThanOrEqual(1);
    expect(liveRanklistRequests[0].search).toContain('token=t0');
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/live-test-key')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/file/download')).toBe(false);
  });
});
