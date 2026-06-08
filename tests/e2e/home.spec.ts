import { expect, test } from '@playwright/test';

test.describe('/', () => {
  test('restores the original home typography and antd-like cards', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/RankLand/);
    await expect(page.locator('[data-id="home-page"]')).toBeVisible();

    await expect(page.getByRole('heading', { name: '欢迎来到 RankLand' })).toHaveCSS('font-size', '32px');
    await expect(page.getByRole('heading', { name: '欢迎来到 RankLand' })).toHaveCSS('font-weight', '500');
    await expect(page.getByRole('heading', { name: '为你推荐' })).toHaveCSS('font-size', '28px');
    await expect(page.getByRole('heading', { name: '为你推荐' })).toHaveCSS('font-weight', '500');

    const exploreCard = page.locator('.rankland-home-card').filter({ hasText: '探索' }).first();
    await expect(exploreCard).toHaveCSS('border-radius', '2px');
    await expect(exploreCard).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(exploreCard.locator('.rankland-home-card-body')).toHaveCSS('padding', '24px');
    await expect(exploreCard.getByRole('heading', { name: '探索' })).toHaveCSS('font-weight', '500');
    await expect(exploreCard.locator('.rankland-home-card-icon')).toHaveCSS('color', 'rgb(38, 38, 38)');
    await exploreCard.hover();
    await expect(exploreCard).toHaveCSS('border-color', 'rgb(255, 129, 4)');

    const homeMetrics = await page.evaluate(() => {
      const pageElement = document.querySelector('[data-id="home-page"]');
      const intro = document.querySelector('.rankland-home-intro');
      const firstSection = document.querySelector('.rankland-section');
      const list = document.querySelector('.rankland-home-list');
      if (!pageElement || !intro || !firstSection || !list) {
        return null;
      }
      return {
        pageGap: getComputedStyle(pageElement).rowGap,
        introGap: getComputedStyle(intro).rowGap,
        sectionGap: getComputedStyle(firstSection).rowGap,
        listGap: getComputedStyle(list).rowGap,
      };
    });
    expect(homeMetrics).toEqual({
      pageGap: '24px',
      introGap: '16px',
      sectionGap: '20px',
      listGap: '0px',
    });
  });
});
