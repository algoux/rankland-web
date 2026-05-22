import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

test.describe('app shell full-chain behavior', () => {
  test('renders the global shell with navigation and site switch on normal routes', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?kw=Test%202024');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toBeVisible();
    await expect(page.locator('[data-id="app-logo-link"]')).toHaveAttribute('href', '/');
    await expect(page.locator('[data-id="app-nav-link"][href="/search"]')).toHaveText('探索');
    await expect(page.locator('[data-id="app-nav-link"][href="/collection/official"]')).toHaveText('榜单合集');
    await expect(page.locator('[data-id="app-nav-link"][href="/playground"]')).toHaveText('演练场');
    await expect(page.locator('[data-id="app-nav-link"][aria-current="page"]')).toHaveAttribute('href', '/search');
    await expect(page.locator('[data-id="app-site-switch"]')).toHaveAttribute(
      'href',
      '//rl.algoux.cn/search?kw=Test%202024',
    );
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
  });

  test('hides the global shell when focus mode is requested with focus=yes', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toHaveCount(0);
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
  });

  test('hides the global shell when focus mode is requested with 聚焦=是', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const focusQuery = `${encodeURIComponent('聚焦')}=${encodeURIComponent('是')}`;
    const response = await page.goto(`/search?${focusQuery}`);

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toHaveCount(0);
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
  });
});
