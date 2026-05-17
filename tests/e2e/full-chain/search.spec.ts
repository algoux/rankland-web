import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function readRequests(request: APIRequestContext) {
  const response = await request.get(`${mockBaseURL}/__requests`);
  return (await response.json()) as Array<{ path: string; search: string }>;
}

test.describe('/search full-chain route', () => {
  test('shows recent ranklists for an empty query through CSR and listAllRanklists', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('探索 - RankLand');
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(3);
    await expect(page.locator('[data-id="search-ranklist-link"][data-ranklist-key="test-key"]')).toHaveAttribute(
      'href',
      '/ranklist/test-key',
    );

    const requests = await readRequests(request);
    expect(requests.filter((requestRecord) => requestRecord.path === '/rank/listall')).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
  });

  test('shows Fuse results for kw query and preserves result count selector', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?kw=Test%202024');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toHaveAttribute('data-result-count', '1');
    await expect(page.locator('[data-id="search-result-count"]')).toHaveText('1');
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(1);
    await expect(page.locator('[data-id="search-ranklist-link"][data-ranklist-key="test-key"]')).toHaveAttribute(
      'href',
      '/ranklist/test-key',
    );

    const requests = await readRequests(request);
    expect(requests.filter((requestRecord) => requestRecord.path === '/rank/listall')).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
  });

  test('treats an empty kw query as the recent-list state', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?kw=');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toHaveCount(0);

    const requests = await readRequests(request);
    expect(requests.filter((requestRecord) => requestRecord.path === '/rank/listall')).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
  });
});
