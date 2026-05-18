import { expect, test } from '@playwright/test';
import { readFile } from 'fs/promises';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function stubClipboard(page: import('@playwright/test').Page) {
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

test.describe('/ranklist/:id full-chain route', () => {
  test('renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await stubClipboard(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Test Contest 2024');
    await expect(page).toHaveTitle('Test Contest 2024 - RankLand');
    await expect(
      page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]'),
    ).toBeVisible();
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expect(page.locator('[data-id="rankland-ranklist-banner"]')).toHaveAttribute(
      'src',
      `${mockBaseURL}/srk-assets/test-key/banner.png`,
    );
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('Powered by Standard Ranklist');
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toBeVisible();

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-srk-action"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('test-key.srk.json');
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    expect(JSON.parse(await readFile(downloadPath!, 'utf8')).contest.title).toBe('Test Contest 2024');

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').click();
    await page.locator('[data-id="rankland-ranklist-copy-link-action"]').click();
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('链接已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(`http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key`);

    await page.locator('[data-id="rankland-ranklist-copy-embed-action"]').click();
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('嵌入代码已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(
      `<iframe src="http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`,
    );

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string; search: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');
    const srkFileRequests = requests.filter(
      (requestRecord) =>
        requestRecord.path === '/file/download' &&
        new URLSearchParams(requestRecord.search).get('id') === 'file-test-1',
    );

    expect(rankRequests).toHaveLength(1);
    expect(srkFileRequests).toHaveLength(1);
  });

  test('renders the Not Found page when the backend returns missing ranklist', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/missing-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found - RankLand');
    await expect(page.locator('[data-id="ranklist-not-found"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-not-found-home-link"][href="/"]')).toBeVisible();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/missing-key');

    expect(rankRequests).toHaveLength(1);
  });
});
