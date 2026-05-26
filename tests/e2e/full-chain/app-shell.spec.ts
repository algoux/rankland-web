import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

type AnalyticsProbeEvent = {
  type: string;
  tag?: string;
  page?: string;
};

async function expectElementWithinViewport(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
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

async function readAnalyticsEvents(page: Page) {
  return page.evaluate(
    () => ((window as unknown as { __ranklandAnalyticsEvents?: AnalyticsProbeEvent[] }).__ranklandAnalyticsEvents || []),
  );
}

test.describe('app shell full-chain behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const darkQuery = '(prefers-color-scheme: dark)';
      let darkMatches = true;
      const listeners = new Set<(event: MediaQueryListEvent) => void>();
      const legacyListeners = new Set<(event: MediaQueryListEvent) => void>();

      window.matchMedia = ((query: string) => {
        const mediaQueryList = {
          media: query,
          get matches() {
            return query === darkQuery ? darkMatches : false;
          },
          onchange: null,
          addEventListener: (eventName: string, listener: (event: MediaQueryListEvent) => void) => {
            if (query === darkQuery && eventName === 'change') {
              listeners.add(listener);
            }
          },
          removeEventListener: (eventName: string, listener: (event: MediaQueryListEvent) => void) => {
            if (query === darkQuery && eventName === 'change') {
              listeners.delete(listener);
            }
          },
          addListener: (listener: (event: MediaQueryListEvent) => void) => {
            if (query === darkQuery) {
              legacyListeners.add(listener);
            }
          },
          removeListener: (listener: (event: MediaQueryListEvent) => void) => {
            if (query === darkQuery) {
              legacyListeners.delete(listener);
            }
          },
          dispatchEvent: () => true,
        };

        return mediaQueryList as MediaQueryList;
      }) as typeof window.matchMedia;

      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      });

      (window as unknown as { __ranklandSetDarkMode?: (matches: boolean) => void }).__ranklandSetDarkMode = (
        matches: boolean,
      ) => {
        darkMatches = matches;
        const event = { matches, media: darkQuery } as MediaQueryListEvent;
        for (const listener of listeners) {
          listener(event);
        }
        for (const listener of legacyListeners) {
          listener(event);
        }
      };
    });
  });

  test('renders the global shell with navigation and site switch on normal routes', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?kw=Test%202024');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toBeVisible();
    await expect(page.locator('[data-id="app-shell"]')).toHaveClass(/ant-layout/);
    await expect(page.locator('[data-id="app-header"]')).toHaveClass(/ant-layout-header/);
    await expect(page.locator('[data-id="app-logo-link"]')).toHaveAttribute('href', '/');
    await expect(page.locator('[data-id="app-nav"]')).toHaveClass(/ant-menu-horizontal/);
    await expect(page.locator('[data-id="app-nav-link"][href="/search"]')).toHaveText('探索');
    await expect(page.locator('[data-id="app-nav-link"][href="/collection/official"]')).toHaveText('榜单合集');
    await expect(page.locator('[data-id="app-nav-link"][href="/playground"]')).toHaveText('演练场');
    await expect(page.locator('[data-id="app-nav-link"][aria-current="page"]')).toHaveAttribute('href', '/search');
    await expect(page.locator('[data-id="app-nav"] .ant-menu-item-selected')).toContainText('探索');
    await expect(page.locator('[data-id="app-site-switch"]')).toHaveClass(/ant-btn/);
    await expect(page.locator('[data-id="app-site-switch"]')).toHaveClass(/ant-dropdown-trigger/);
    await page.locator('[data-id="app-site-switch"]').hover();
    await expect(page.locator('[data-id="app-site-switch-link"]')).toHaveAttribute(
      'href',
      '//rl.algoux.cn/search?kw=Test%202024',
    );
    await expect(page.locator('[data-id="app-site-switch-link"] .anticon-arrow-right')).toBeVisible();
    await expect(page.locator('[data-id="app-site-switch-link"] .app-site-switch-arrow')).toHaveCount(0);
    await expect(page.locator('[data-id="search-page"]')).toBeVisible();
  });

  test('bootstraps the system theme before the app is hydrated', async ({ request }) => {
    const response = await request.get('/');

    expect(response.ok()).toBe(true);
    const html = await response.text();
    const bootstrapIndex = html.indexOf('data-rankland-theme-bootstrap');
    expect(bootstrapIndex).toBeGreaterThan(-1);
    expect(bootstrapIndex).toBeLessThan(html.indexOf('<body'));
    expect(html).toContain("document.documentElement.className = systemThemeMediaQuery.matches ? 'dark' : 'light'");
  });

  test('syncs system theme and macOS Blink optimization after hydration', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveClass('dark');
    await expect(page.locator('body')).toHaveClass(/optimize-decrease-effects/);

    await page.evaluate(() => {
      (window as unknown as { __ranklandSetDarkMode: (matches: boolean) => void }).__ranklandSetDarkMode(false);
    });

    await expect(page.locator('html')).toHaveClass('light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(242, 242, 242)');
  });

  test('keeps the app shell within desktop and mobile viewport bounds', async ({ page, request }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toBeVisible();
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="app-logo-link"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="app-site-switch"]'), page);
    await page.screenshot({ path: testInfo.outputPath('app-shell-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toBeVisible();
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="app-logo-link"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="app-site-switch"]'), page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('[data-id="app-back-top"]')).toBeVisible();
    await expect(page.locator('[data-id="app-back-top"]')).toHaveClass(/ant-back-top/);
    await expectElementWithinViewport(page.locator('[data-id="app-back-top"]'), page);
    await page.screenshot({ path: testInfo.outputPath('app-shell-mobile.png'), fullPage: true });
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

  test('renders the legacy fallback 404 copy and spacing for unknown public routes', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/unknown-public-route');

    expect(response).not.toBeNull();
    expect(response?.status()).toBe(404);
    await expect(page.locator('[data-id="fallback-not-found"]')).toHaveText('404 Not Found · 你来到了榜单荒地');
    await expect(page.locator('[data-id="fallback-not-found"]')).toHaveCSS('margin-top', '128px');
    await expect(page.locator('[data-id="fallback-not-found"]')).toHaveCSS('font-size', '20px');
    await expect(page.locator('[data-id="fallback-not-found"]')).toHaveCSS('text-align', 'center');
  });

  test('initializes analytics once and sends pageviews for initial and CSR navigation routes', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/search?kw=Analytics%202024');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect
      .poll(async () => readAnalyticsEvents(page))
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'initialize', tag: 'G-D6CVTJBDZT' }),
          expect.objectContaining({
            type: 'pageview',
            page: 'http://127.0.0.1:3100/search?kw=Analytics%202024',
          }),
        ]),
      );

    await page.locator('[data-id="app-nav-link"][href="/playground"]').click();

    await expect
      .poll(async () => readAnalyticsEvents(page))
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'pageview', page: 'http://127.0.0.1:3100/playground' }),
        ]),
      );

    const events = await readAnalyticsEvents(page);
    expect(events.filter((event) => event.type === 'initialize')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'pageview')).toHaveLength(2);
  });
});
