import { expect, test } from '@playwright/test';

test.describe('cross-cutting RankLand behavior', () => {
  test('keeps the legacy document head defaults', async ({ page, context }) => {
    const blockedPage = await context.newPage();
    await blockedPage.route(/.*\.js(\?.*)?$/, (route) => route.abort());
    await blockedPage.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await blockedPage.evaluate(() => ({
      bodyOpacity: getComputedStyle(document.body).opacity,
      hydrated: document.body.dataset.ranklandHydrated || '',
    }))).toEqual({
      bodyOpacity: '0',
      hydrated: '',
    });
    await blockedPage.close();

    await page.goto('/');
    await page.waitForFunction(() => document.body.dataset.ranklandHydrated === 'true');
    await page.waitForFunction(() => getComputedStyle(document.body).opacity === '1');

    const head = await page.evaluate(() => {
      const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute('content') || '';
      const bodyStyle = getComputedStyle(document.body);
      return {
        colorScheme: meta('meta[name="color-scheme"]'),
        darkreaderLock: Boolean(document.head.querySelector('meta[name="darkreader-lock"]')),
        description: meta('meta[name="description"]'),
        htmlClass: document.documentElement.className,
        keywords: meta('meta[name="keywords"]'),
        lang: document.documentElement.lang,
        ogDescription: meta('meta[property="og:description"]'),
        ogLocale: meta('meta[property="og:locale"]'),
        ogSiteName: meta('meta[property="og:site_name"]'),
        ogType: meta('meta[property="og:type"]'),
        twitterCard: meta('meta[name="twitter:card"]'),
        viewport: meta('meta[name="viewport"]'),
        bodyHydrated: document.body.dataset.ranklandHydrated || '',
        bodyInlineOpacity: document.body.style.opacity,
        bodyOpacity: bodyStyle.opacity,
        bodyTransitionProperty: bodyStyle.transitionProperty,
      };
    });

    expect(head).toMatchObject({
      colorScheme: 'dark light',
      darkreaderLock: true,
      description: '专业的算法竞赛榜单平台，收录 ICPC、CCPC 等各类赛事的榜单。',
      keywords: 'RankLand,programming,algorithm,ranklist,standings,编程,算法,竞赛,程序设计,ICPC,CCPC,榜单,排名',
      lang: 'zh-Hans',
      ogDescription: 'RankLand: 专业算竞榜单平台',
      ogLocale: 'zh_CN',
      ogSiteName: 'RankLand',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      viewport: 'width=device-width,initial-scale=1,minimum-scale=0.5,maximum-scale=1.0,user-scalable=yes',
      bodyHydrated: 'true',
      bodyInlineOpacity: '1',
      bodyOpacity: '1',
    });
    expect(['dark', 'light']).toContain(head.htmlClass);
    expect(head.bodyTransitionProperty.split(',').map((item) => item.trim())).toContain('opacity');
  });

  test('keeps the page-level SEO tags from the original TSX pages', async ({ page }) => {
    const readSeo = async () => page.evaluate(() => ({
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      jsonLdCount: document.head.querySelectorAll('script[type="application/ld+json"]').length,
      ogTitle: document.head.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogUrl: document.head.querySelector('meta[property="og:url"]')?.getAttribute('content') || '',
      title: document.title,
    }));

    await page.goto('/');
    await expect(page).toHaveTitle('RankLand');
    expect(await readSeo()).toMatchObject({
      canonical: 'https://rl.algoux.org/',
      jsonLdCount: 2,
      ogTitle: 'RankLand',
      ogUrl: 'https://rl.algoux.org/',
      title: 'RankLand',
    });

    await page.goto('/search');
    await expect(page).toHaveTitle('探索 | RankLand');
    expect(await readSeo()).toMatchObject({
      ogTitle: '探索 | RankLand',
      title: '探索 | RankLand',
    });

    await page.goto('/ranklist/test-key');
    await expect(page).toHaveTitle('Test Contest 2024 | RankLand');
    expect(await readSeo()).toMatchObject({
      canonical: 'https://rl.algoux.org/ranklist/test-key',
      ogTitle: 'Test Contest 2024 | RankLand',
      ogUrl: 'https://rl.algoux.org/ranklist/test-key',
      title: 'Test Contest 2024 | RankLand',
    });

    await page.goto('/collection/official?rankId=test-key');
    await expect(page).toHaveTitle('Test Contest 2024 - 榜单合集 | RankLand');
    expect(await readSeo()).toMatchObject({
      canonical: 'https://rl.algoux.org/collection/official?rankId=test-key',
      ogTitle: 'Test Contest 2024 - 榜单合集 | RankLand',
      ogUrl: 'https://rl.algoux.org/collection/official?rankId=test-key',
      title: 'Test Contest 2024 - 榜单合集 | RankLand',
    });

    await page.goto('/playground');
    await expect(page).toHaveTitle('Playground | RankLand');
    expect(await readSeo()).toMatchObject({
      ogTitle: 'Playground | RankLand',
      title: 'Playground | RankLand',
    });

    await page.goto('/live/mock-live');
    await expect(page).toHaveTitle('Live: Test Contest 2024 | RankLand');
    expect(await readSeo()).toMatchObject({
      ogTitle: 'Live: Test Contest 2024 | RankLand',
      title: 'Live: Test Contest 2024 | RankLand',
    });

    await page.goto('/not-a-route');
    await expect(page).toHaveTitle('Not Found | RankLand');
  });

  test('renders the fallback 404 page with HTTP 404', async ({ page }) => {
    const response = await page.goto('/not-a-route');

    expect(response?.status()).toBe(404);
    await expect(page.locator('[data-id="not-found-page"]')).toBeVisible({ timeout: 20_000 });
  });

  test('does not expose legacy template routes after the RankLand migration', async ({ page }) => {
    for (const path of ['/about', '/demo/detail/1']) {
      const response = await page.goto(path);

      expect(response?.status(), path).toBe(404);
      await expect(page.locator('[data-id="not-found-page"]')).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('body')).not.toContainText('This is the About Page');
      await expect(page.locator('body')).not.toContainText('This is the Detail Page');
    }
  });

  test('keeps readable layout on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');

    await expect(page.locator('text=欢迎来到 RankLand')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('header')).toBeVisible();
  });

  test('syncs light and dark themes from system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 20_000 });

    await page.emulateMedia({ colorScheme: 'light' });

    await expect(page.locator('html')).toHaveClass(/light/);
  });
});
