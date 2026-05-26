import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function readRequests(request: APIRequestContext) {
  const response = await request.get(`${mockBaseURL}/__requests`);
  return (await response.json()) as Array<{ path: string; search: string }>;
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
    await expect(page).toHaveTitle('探索 - RankLand');
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
    await expect(page.locator('[data-id="search-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible();
    await expect(page.locator('[data-id="search-ranklist-item"]')).toHaveCount(3);
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
    await expect(
      page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"] .anticon-eye'),
    ).toBeVisible();

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
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="search-input"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="search-submit"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="search-ranklist-item"]').first(), page);
    await page.screenshot({ path: testInfo.outputPath('search-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/search?kw=Test%202024');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="search-input"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="search-submit"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="search-ranklist-item"]').first(), page);
    await page.screenshot({ path: testInfo.outputPath('search-mobile.png'), fullPage: true });
  });
});
