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

test.describe('/ full-chain route', () => {
  test('renders the RankLand home page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    const html = await response!.text();
    expect(html).toContain('欢迎来到 RankLand');
    expect(html).toContain('1234');
    expect(html).toContain('56789');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('https://rl.algoux.org/search?kw={search_term_string}');
    await expect(page).toHaveTitle('RankLand');
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expect(page.locator('[data-id="home-total-srk-count"]')).toHaveText('1234');
    await expect(page.locator('[data-id="home-total-view-count"]')).toHaveText('56789');
    await expect(page.locator('[data-id="home-recommendation-search"][href="/search"]')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendation-collection"][href="/collection/official"]')).toBeVisible();
    await expect(page.locator('[data-id="home-hydrated"]')).toHaveText('hydrated');
    await page.locator('[data-id="home-contact"] [data-id="contact-us-trigger"]').click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toBeVisible();
    await expect(page.locator('[data-id="contact-us-email"][href="mailto:algoux.org@gmail.com"]')).toHaveText(
      'algoux.org@gmail.com',
    );
    await expect(page.locator('[data-id="contact-us-qq-image"]')).toBeVisible();
    await page.locator('[data-id="contact-us-close"]').click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toHaveCount(0);

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const statisticsRequests = requests.filter((requestRecord) => requestRecord.path === '/statistics');

    expect(statisticsRequests).toHaveLength(1);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/listall')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/search')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/test-key')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/file/download')).toBe(false);
  });

  test('keeps the home page layout within desktop and mobile viewport bounds', async ({ page, request }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expect(page.locator('[data-id="home-hero"]')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendations"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-search"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-collection"]'), page);
    await page.screenshot({ path: testInfo.outputPath('home-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="home-hero"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-search"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="home-recommendation-collection"]'), page);
    await page.screenshot({ path: testInfo.outputPath('home-mobile.png'), fullPage: true });
  });
});
