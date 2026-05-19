import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
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

async function stubClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText = text;
        },
      },
    });
  });
}

test.describe('/live/:id full-chain route', () => {
  test('hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await stubClipboard(page);
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
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toBeVisible();
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeVisible();

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').click();
    await expect(page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]')).toBeEnabled();
    await expect(page.locator('[data-id="rankland-ranklist-export-vjudge-action"]')).toBeEnabled();
    await expect(page.locator('[data-id="rankland-ranklist-export-xlsx-action"]')).toBeEnabled();

    const liveGymGhostDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]').click();
    const liveGymGhostDownload = await liveGymGhostDownloadPromise;
    expect(liveGymGhostDownload.suggestedFilename()).toBe('live-test-key_gymghost.dat');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Gym Ghost 已导出');

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').click();
    await page.locator('[data-id="rankland-ranklist-copy-embed-action"]').click();
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('嵌入代码已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(
      `<iframe src="http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/live/live-test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`,
    );

    await page.selectOption('[data-id="rankland-ranklist-organization-filter"]', ['Org A']);
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeHidden();

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    await expect(userModal).toContainText('Team Alpha');
    await expect(userModal).toContainText('Org A');
    await expect(userModal.locator('[data-id="rankland-user-modal-photo"]')).toHaveAttribute(
      'src',
      `${mockBaseURL}/srk-assets/live-test-key/team-alpha.png`,
    );
    await expect(userModal.locator('[data-id="rankland-rank-time-panel"]')).toBeVisible();
    await expect(userModal.locator('[data-id="rankland-rank-time-unit"]')).toHaveText('单位：min');
    await expect(userModal.locator('[data-id="rankland-rank-time-event"]')).toContainText(['A', 'B']);
    await expect(userModal.locator('[data-id="rankland-rank-time-curve"]')).toBeVisible();
    await userModal.getByRole('button', { name: 'Close' }).click();
    await expect(userModal.locator('.srk-modal')).toBeHidden();

    await page
      .locator('tr', { hasText: 'Team Alpha' })
      .locator('.srk-prest-status-block-accepted')
      .first()
      .click();
    const solutionModal = page.locator('[data-id="rankland-ranklist-solution-modal"]');
    await expect(solutionModal.locator('.srk-modal')).toBeVisible();
    await expect(solutionModal).toContainText('Solutions of A (Team Alpha)');
    await expect(solutionModal).toContainText('Accepted');
    await solutionModal.getByRole('button', { name: 'Close' }).click();
    await expect(solutionModal.locator('.srk-modal')).toBeHidden();

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

    await page.evaluate((url) => {
      (
        window as unknown as {
          __ranklandEmitWsError: (url: string) => void;
        }
      ).__ranklandEmitWsError(url);
    }, `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`);
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('error');
    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();

    const requests = await readRequests(request);
    const liveInfoRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/config/live-test-key');
    const liveRanklistRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/live-rid-1');

    expect(liveInfoRequests).toHaveLength(1);
    expect(liveRanklistRequests.length).toBeGreaterThanOrEqual(1);
    expect(liveRanklistRequests[0].search).toContain('token=t0');
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/live-test-key')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/file/download')).toBe(false);
  });

  test('renders the Not Found page when the backend returns missing live contest info', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/live/missing-live');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found - RankLand');
    await expect(page.locator('[data-id="live-not-found"]')).toBeVisible();
    await expect(page.locator('[data-id="live-not-found-home-link"][href="/"]')).toBeVisible();

    const requests = await readRequests(request);
    const liveInfoRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/config/missing-live');
    const liveRanklistRequests = requests.filter((requestRecord) => /^\/ranking\/[^/]+$/.test(requestRecord.path));

    expect(liveInfoRequests).toHaveLength(1);
    expect(liveRanklistRequests).toHaveLength(0);
  });

  test('disables scroll-solution mode, preserves other queries, and closes the WebSocket', async ({ page, request }) => {
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&scrollSolution=1&focus=yes');

    const wsUrl = `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`;
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await page.locator('[data-id="live-scroll-solution-toggle"]').click();

    await expect(page).toHaveURL(/\/live\/live-test-key\?token=t0&focus=yes$/);
    await expect(page.locator('[data-id="live-scroll-solution"]')).toBeHidden();
    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __ranklandWsClosedUrls?: string[] }).__ranklandWsClosedUrls || []),
      )
      .toContain(wsUrl);
  });

  test('reports unexpected WebSocket close as a realtime error while keeping the ranklist visible', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&scrollSolution=1');

    const wsUrl = `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`;
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await page.evaluate((url) => {
      (
        window as unknown as {
          __ranklandEmitWsClose: (url: string) => void;
        }
      ).__ranklandEmitWsClose(url);
    }, wsUrl);

    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('error');
    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
  });
});
