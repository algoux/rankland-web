import { expect, test } from './test';

const collection = '/collection/official?rankId=large-key';
const ranklist = '/ranklist/large-key';
const live = '/live/live-test-key';
const scale = () => window.visualViewport?.scale;

test('serves the same viewport markup to desktop and handheld browsers', async ({ browser, page }) => {
  await page.addInitScript(() => localStorage.setItem('StyledRanklistSettingsIntroRead', 'true'));
  const desktopResponse = await page.goto(collection);
  expect(await desktopResponse?.text()).toContain('initial-scale=1,minimum-scale=0.5');
  await expect(page.locator('.srk-main table')).toBeVisible();
  await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '300px');
  expect(await page.evaluate(scale)).toBe(1);

  // The desktop request above primes the same SSR cache entry used by the phone.
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const mobilePage = await phone.newPage();
    await mobilePage.addInitScript(() => localStorage.setItem('StyledRanklistSettingsIntroRead', 'true'));
    const mobileResponse = await mobilePage.goto(new URL(collection, page.url()).href);
    expect(await mobileResponse?.text()).toContain('initial-scale=1,minimum-scale=0.5');
    await expect(mobilePage.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '48px');
    expect(await mobilePage.evaluate(scale)).toBeCloseTo(0.5);
    await mobilePage.reload();
    await expect(mobilePage.locator('.srk-main table')).toBeVisible();
    await expect.poll(() => mobilePage.evaluate(scale)).toBeCloseTo(0.5);
  } finally {
    await phone.close();
  }
});

test.describe('handheld ranklist viewport', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  for (const path of [ranklist, `${ranklist}?ssr=0`, live]) {
    test(`starts ${path} at the minimum scale`, async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('StyledRanklistSettingsIntroRead', 'true'));
      await page.goto(path);
      await expect(page.locator('.srk-main table')).toBeVisible();
      expect(await page.evaluate(scale)).toBeCloseTo(0.5);
      await expect(page.locator('[data-id="ranklist-mobile-settings-action"]')).toBeVisible();
    });
  }

  test('updates the scale on client navigation into and out of a collection', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => document.body.dataset.ranklandHydrated === 'true');
    expect(await page.evaluate(scale)).toBe(1);

    await page.getByRole('link', { name: '榜单合集', exact: true }).click();
    await expect(page.locator('[data-id="collection-sidebar"]')).toBeVisible();
    await expect.poll(() => page.evaluate(scale)).toBeCloseTo(0.5);

    await page.getByRole('link', { name: 'RankLand', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(scale)).toBeCloseTo(1);
  });
});
