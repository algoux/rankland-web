import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

test.describe('/collection/:id full-chain route', () => {
  test('renders selected ranklist through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official?rankId=test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Test Contest 2024');
    await expect(page).toHaveTitle('Test Contest 2024 - 榜单合集 - RankLand');
    await expect(page.locator('[data-id="collection-nav"]')).toBeVisible();
    await expect(
      page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-id="collection-menu-item-test-key"][data-collection-key="test-key"]'),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeVisible();
    await expect(page.locator('[data-id="collection-hydrated"]')).toHaveText('hydrated');

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string; search: string }>;
    const collectionRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/group/official');
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');
    const srkFileRequests = requests.filter(
      (requestRecord) =>
        requestRecord.path === '/file/download' &&
        new URLSearchParams(requestRecord.search).get('id') === 'file-test-1',
    );

    expect(collectionRequests).toHaveLength(1);
    expect(rankRequests).toHaveLength(1);
    expect(srkFileRequests).toHaveLength(1);
  });

  test('renders collection empty state when no rankId is selected', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('榜单合集 - RankLand');
    await expect(page.locator('[data-id="collection-nav"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-hydrated"]')).toHaveText('hydrated');

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const collectionRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/group/official');
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');

    expect(collectionRequests).toHaveLength(1);
    expect(rankRequests).toHaveLength(0);
  });

  test('renders collection not found for a missing collection', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/missing-collection');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found - RankLand');
    await expect(page.locator('[data-id="collection-not-found"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-not-found-home-link"][href="/"]')).toBeVisible();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const collectionRequests = requests.filter(
      (requestRecord) => requestRecord.path === '/rank/group/missing-collection',
    );

    expect(collectionRequests).toHaveLength(1);
  });

  test('replaces invalid rankId without requesting missing ranklist data', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official?rankId=missing-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL('/collection/official');
    await expect(page.locator('[data-id="collection-empty-state"]')).toBeVisible();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const collectionRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/group/official');
    const missingRankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/missing-key');

    expect(collectionRequests).toHaveLength(1);
    expect(missingRankRequests).toHaveLength(0);
  });

  test('replaces invalid rankId after CSR query-only navigation', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="collection-hydrated"]')).toHaveText('hydrated');
    await request.post(`${mockBaseURL}/__reset`);

    await page.evaluate(() => {
      window.history.pushState({}, '', '/collection/official?rankId=missing-key');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page).toHaveURL('/collection/official');
    await expect(page.locator('[data-id="collection-empty-state"]')).toBeVisible();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const collectionRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/group/official');
    const missingRankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/missing-key');

    expect(collectionRequests).toHaveLength(1);
    expect(missingRankRequests).toHaveLength(0);
  });
});
