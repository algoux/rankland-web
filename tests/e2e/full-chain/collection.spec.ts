import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function expectElementWithinViewport(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
}

async function expectNoHorizontalDocumentOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.documentScrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

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
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeVisible();
    await expect(page.locator('[data-id="collection-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('浏览 42');
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('Powered by Standard Ranklist');
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toBeVisible();
    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    await expect(page.locator('[data-id="rankland-ranklist-export-srk-action"]')).toBeVisible();

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

  test('renders the legacy Ant Design collection menu with category icons', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/collection/official?rankId=test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="collection-nav-menu"]')).toHaveClass(/ant-menu-inline/);
    await expect(page.locator('[data-id="collection-collapse-button"]')).toHaveClass(/ant-btn/);
    await expect(page.locator('[data-id="collection-collapse-button"] .anticon-menu-fold')).toBeVisible();
    await expect(page.locator('[data-id="collection-category-icon-dir-icpc"] img')).toHaveAttribute('alt', 'ICPC');
    await expect(page.locator('[data-id="collection-category-icon-dir-ccpc"] img')).toHaveAttribute('alt', 'CCPC');
    await expect(
      page.locator('[data-id="collection-menu-item-test-key"][data-collection-key="test-key"]'),
    ).toBeVisible();
    await expect(page.locator('[data-id="collection-nav-menu"] .ant-menu-item-selected')).toContainText(
      'Test Contest 2024',
    );
  });

  test('uses the legacy mobile nav collapse behavior', async ({ page, request }) => {
    await denyExternalCalls(page);
    await page.addInitScript(() => window.localStorage.removeItem('CollectionNavCollapsed'));
    await request.post(`${mockBaseURL}/__reset`);
    await page.setViewportSize({ width: 390, height: 844 });

    const response = await page.goto('/collection/official?rankId=test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="collection-content"]')).toHaveClass(/is-nav-collapsed/);
    await expect(page.locator('[data-id="collection-collapse-button"] .anticon-menu-unfold')).toBeVisible();
    await expect(page.locator('[data-id="collection-ranklist-content"]')).toBeVisible();

    await page.locator('[data-id="collection-collapse-button"]').click();

    await expect(page.locator('[data-id="collection-content"]')).not.toHaveClass(/is-nav-collapsed/);
    await expect(page.locator('[data-id="collection-ranklist-panel"]')).toBeHidden();

    await page.locator('[data-id="collection-menu-item-another-key"]').click();

    await expect(page).toHaveURL('/collection/official?rankId=another-key');
    await expect(page.locator('[data-id="collection-content"]')).toHaveClass(/is-nav-collapsed/);
    await expect(page.locator('[data-id="collection-ranklist-panel"]')).toBeVisible();
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

  test('keeps the collection page wrappers within desktop and mobile viewport bounds', async ({
    page,
    request,
  }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/collection/official?rankId=test-key');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="collection-content"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-nav"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-ranklist-content"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="collection-nav"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="collection-ranklist-content"]'), page);
    await page.screenshot({ path: testInfo.outputPath('collection-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/collection/official?rankId=test-key');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="collection-content"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-nav"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-ranklist-content"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="collection-nav"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="collection-ranklist-content"]'), page);
    await page.screenshot({ path: testInfo.outputPath('collection-mobile.png'), fullPage: true });
  });
});
