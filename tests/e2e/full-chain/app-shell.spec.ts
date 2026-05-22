import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

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
