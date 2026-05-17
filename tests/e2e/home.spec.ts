import { expect, test } from '@playwright/test';
import { denyExternalCalls, installApiMocks } from './helpers/mock-api';

test.describe('RankLand home smoke', () => {
  test('renders the real home route', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#app')).toBeAttached();
    await expect(page.locator('[data-id="home-content"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: '欢迎来到 RankLand' })).toBeVisible();
    await expect(page.locator('[data-id="home-total-srk-count"]')).toHaveText('1234');
    await expect(page.locator('[data-id="home-recommendation-search"][href="/search"]')).toBeVisible();
    await expect(page.locator('[data-id="home-recommendation-collection"][href="/collection/official"]')).toBeVisible();
  });
});
