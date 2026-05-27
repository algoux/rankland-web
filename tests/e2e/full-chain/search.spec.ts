import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function readRequests(request: APIRequestContext) {
  const response = await request.get(`${mockBaseURL}/__requests`);
  return (await response.json()) as Array<{ path: string; search: string }>;
}

async function forceSystemDarkMode(page: Page) {
  await page.addInitScript(() => {
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: query === '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })) as typeof window.matchMedia;
  });
}

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

test.describe('/search full-chain route', () => {
  test('shows recent ranklists for an empty query through CSR and listAllRanklists', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('探索 | RankLand');
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
    await expect(page.locator('[data-id="search-page"]')).toHaveClass(/normal-content/);
    await expect(page.locator('[data-id="search-page"]')).toHaveJSProperty('tagName', 'DIV');
    await expect(page.locator('[data-id="search-page"]')).not.toHaveClass(/search-page/);
    await expect(page.locator('[data-id="search-page"] > div').first()).toBeVisible();
    await expect(page.locator('[data-id="search-page"] > div').first()).not.toHaveClass(/search-panel/);
    await expect(page.locator('[data-id="search-page"] > section.search-panel')).toHaveCount(0);
    await expect(page.locator('[data-id="search-page"]')).not.toHaveCSS('min-height', '560px');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('width', '1px');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('height', '1px');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('h3.mb-6', { hasText: '在榜单数据库中探索' })).toBeVisible();
    await expect(page.locator('.ant-input-search:has([data-id="search-input"])')).toBeVisible();
    await expect(page.locator('[data-id="search-input"].ant-input')).toBeVisible();
    await expect(page.locator('.ant-input-search-button.ant-btn-primary')).toBeVisible();
    await expect(page.locator('.ant-input-search-button .anticon-search')).toBeVisible();
    await expect(page.locator('.ant-input-search-button')).toHaveText('');
    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-recent-section"]')).toHaveJSProperty('tagName', 'DIV');
    await expect(page.locator('[data-id="search-recent-section"]')).not.toHaveClass(/search-section/);
    await expect(page.locator('[data-id="search-recent-section"] > div.opacity-70').first()).toHaveText('最近更新');
    await expect(page.locator('[data-id="search-recent-section"] > div.opacity-70').first()).not.toHaveClass(
      /search-section-title/,
    );
    await expect(page.locator('[data-id="search-recent-section"] > div.mt-2 > .ant-list.ant-list-sm')).toBeVisible();
    await expect(page.locator('[data-id="search-recent-section"] .search-list')).toHaveCount(0);
    await expect(page.locator('[data-id="search-recent-section"] .ant-list.ant-list-sm')).toBeVisible();
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(3);
    await expect(page.locator('[data-id="search-ranklist-item"].ant-list-item')).toHaveCount(3);
    await expect(page.locator('[data-id="search-ranklist-link"][data-ranklist-key="test-key"]')).toHaveAttribute(
      'href',
      '/ranklist/test-key',
    );
    await expect(
      page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"] .anticon-eye'),
    ).toBeVisible();

    const requests = await readRequests(request);
    expect(requests.filter((requestRecord) => requestRecord.path === '/rank/listall')).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
  });

  test('renders the legacy Ant Design loading spinner while ranklists are loading', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await page.route('**/rank/listall', async (route) => {
      await page.waitForTimeout(250);
      await route.continue();
    });

    const response = await page.goto('/search');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-loading"].ant-spin')).toBeVisible();
    await expect(page.locator('[data-id="search-loading"]')).toHaveClass(/mt-10/);
    await expect(page.locator('[data-id="search-loading"]')).not.toHaveClass(/search-state/);
    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible();
  });

  test('renders the legacy search load error color when ranklist initialization fails', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await page.route('**/rank/listall', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'mock listall failure', data: null }),
      });
    });

    const response = await page.goto('/search');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-error"]')).toHaveText(
      '初始化榜单数据库失败，请刷新再试。',
    );
    await expect(page.locator('[data-id="search-error"]')).toHaveClass(/mt-10/);
    await expect(page.locator('[data-id="search-error"]')).not.toHaveClass(/search-state/);
    await expect(page.locator('[data-id="search-error"]')).not.toHaveClass(/text-red-500/);
    await expect(page.locator('[data-id="search-error"]')).toHaveCSS('margin-top', '40px');
    await expect(page.locator('[data-id="search-error"] .search-error-message')).toHaveText(
      '初始化榜单数据库失败，请刷新再试。',
    );
    await expect(page.locator('[data-id="search-error"] .search-error-message')).toHaveClass(/text-red-500/);
    await expect(page.locator('[data-id="search-error"] .search-error-message')).toHaveCSS('color', 'rgb(239, 68, 68)');
  });

  test('renders the recent empty state with the legacy mt-2 spacing', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await forceSystemDarkMode(page);
    await page.route('**/rank/listall', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, message: 'success', data: { ranks: [] } }),
      });
    });

    const response = await page.goto('/search');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(0);
    const recentEmptyState = page.locator('[data-id="search-recent-section"] > div.mt-2', {
      hasText: '暂无最近更新的榜单',
    });
    await expect(recentEmptyState).toBeVisible();
    await expect(recentEmptyState).not.toHaveClass(/search-empty-state/);
    await expect(recentEmptyState).toHaveCSS('margin-top', '8px');
    await expect(recentEmptyState).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
  });

  test('shows Fuse results for kw query and preserves result count selector', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?kw=Test%202024');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('.ant-input-search:has([data-id="search-input"])')).toBeVisible();
    await expect(page.locator('[data-id="search-input"].ant-input')).toHaveValue('Test 2024');
    await expect(page.locator('.ant-input-search:has([data-id="search-input"]) .ant-input-clear-icon')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toHaveJSProperty('tagName', 'DIV');
    await expect(page.locator('[data-id="search-result-section"]')).not.toHaveClass(/search-section/);
    await expect(page.locator('[data-id="search-result-section"]')).toHaveAttribute('data-result-count', '1');
    await expect(page.locator('[data-id="search-result-count"]')).toHaveText('1');
    await expect(page.locator('[data-id="search-result-section"] > div.opacity-70').first()).toContainText(
      '搜索到 1 个结果',
    );
    await expect(page.locator('[data-id="search-result-section"] > div.opacity-70').first()).not.toHaveClass(
      /search-section-title/,
    );
    await expect(page.locator('[data-id="search-result-section"] > div.mt-2 > .ant-list.ant-list-sm')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"] .search-list')).toHaveCount(0);
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(1);
    await expect(page.locator('[data-id="search-ranklist-item"].ant-list-item')).toHaveCount(1);
    await expect(page.locator('[data-id="search-ranklist-link"][data-ranklist-key="test-key"]')).toHaveAttribute(
      'href',
      '/ranklist/test-key',
    );
    await expect(
      page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"] .anticon-eye'),
    ).toBeVisible();
    await expect(page.locator('[data-id="search-ranklist-item"] .search-view-count')).toHaveCSS('opacity', '0.7');
    await expect(page.locator('[data-id="search-ranklist-item"] .search-created-at')).toHaveCSS(
      'margin-top',
      '0px',
    );
    await expect(page.locator('[data-id="search-ranklist-item"] .search-created-at')).toHaveCSS('opacity', '0.5');
    await expect(page.locator('[data-id="search-ranklist-item"] .search-created-at')).toHaveCSS(
      'font-size',
      '14px',
    );

    const requests = await readRequests(request);
    expect(requests.filter((requestRecord) => requestRecord.path === '/rank/listall')).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
  });

  test('renders legacy search list utility class tokens', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const resultResponse = await page.goto('/search?kw=Test%202024');

    expect(resultResponse).not.toBeNull();
    expect(resultResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-result-section"]')).toHaveClass(/mt-10/);
    await expect(page.locator('[data-id="search-result-section"] > div.opacity-70')).toHaveClass(/opacity-70/);
    await expect(page.locator('[data-id="search-result-section"] > div.mt-2')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"] > div.mt-2')).toHaveClass(/mt-2/);
    await expect(page.locator('[data-id="search-result-section"] > div.mt-2 > .ant-list')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"] .search-row-title')).toHaveClass(/mb-0/);
    await expect(page.locator('[data-id="search-result-section"] .search-view-count')).toHaveClass(/ml-2/);
    await expect(page.locator('[data-id="search-result-section"] .search-view-count')).toHaveClass(/opacity-70/);
    await expect(page.locator('[data-id="search-result-section"] .search-created-at')).toHaveClass(/mb-0/);
    await expect(page.locator('[data-id="search-result-section"] .search-created-at')).toHaveClass(/opacity-50/);
    await expect(page.locator('[data-id="search-result-section"] .search-created-at')).toHaveClass(/text-sm/);

    const recentResponse = await page.goto('/search');

    expect(recentResponse).not.toBeNull();
    expect(recentResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-recent-section"]')).toHaveClass(/mt-10/);
    await expect(page.locator('[data-id="search-recent-section"] > div.opacity-70')).toHaveClass(/opacity-70/);
    await expect(page.locator('[data-id="search-recent-section"] > div.mt-2')).toBeVisible();
    await expect(page.locator('[data-id="search-recent-section"] > div.mt-2')).toHaveClass(/mt-2/);
    await expect(page.locator('[data-id="search-recent-section"] > div.mt-2 > .ant-list')).toBeVisible();
    await expect(page.locator('[data-id="search-recent-section"] .search-row-title').first()).toHaveClass(/mb-0/);
    await expect(page.locator('[data-id="search-recent-section"] .search-view-count').first()).toHaveClass(/ml-2/);
    await expect(page.locator('[data-id="search-recent-section"] .search-view-count').first()).toHaveClass(
      /opacity-70/,
    );
    await expect(page.locator('[data-id="search-recent-section"] .search-created-at').first()).toHaveClass(/mb-0/);
    await expect(page.locator('[data-id="search-recent-section"] .search-created-at').first()).toHaveClass(
      /opacity-50/,
    );
    await expect(page.locator('[data-id="search-recent-section"] .search-created-at').first()).toHaveClass(/text-sm/);
  });

  test('renders zero search results without an extra empty-state message like the legacy page', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?kw=NoSuchContest999');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toHaveAttribute('data-result-count', '0');
    await expect(page.locator('[data-id="search-result-count"]')).toHaveText('0');
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(0);
    await expect(page.locator('[data-id="search-empty-state"]')).toHaveCount(0);

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

  test('keeps search results within desktop and mobile viewport bounds', async ({ page, request }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/search?kw=Test%202024');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(1);
    await expect(page.locator('[data-id="search-page"]')).toHaveCSS('padding-top', '32px');
    await expect(page.locator('[data-id="search-page"]')).toHaveCSS('padding-left', '50px');
    await expect(page.locator('[data-id="search-page"]')).toHaveCSS('padding-right', '50px');
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="search-input"]'), page);
    await expectElementWithinViewport(page.locator('.ant-input-search-button'), page);
    await expectElementWithinViewport(page.locator('[data-id="search-ranklist-item"]').first(), page);
    await page.screenshot({ path: testInfo.outputPath('search-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/search?kw=Test%202024');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-page"]')).toHaveCSS('padding-left', '20px');
    await expect(page.locator('[data-id="search-page"]')).toHaveCSS('padding-right', '20px');
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="search-input"]'), page);
    await expectElementWithinViewport(page.locator('.ant-input-search-button'), page);
    await expectElementWithinViewport(page.locator('[data-id="search-ranklist-item"]').first(), page);
    await page.screenshot({ path: testInfo.outputPath('search-mobile.png'), fullPage: true });
  });
});
