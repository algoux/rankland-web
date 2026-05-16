import { expect, test } from '@playwright/test';
import { denyExternalCalls, installApiMocks } from './helpers/mock-api';

test.describe('current app smoke', () => {
  test('renders the existing home route', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#app')).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Welcome to bwcx Demo' })).toBeVisible();
  });
});
