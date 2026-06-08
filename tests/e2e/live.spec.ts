import { expect, test } from '@playwright/test';
import { stubWebSocket } from './helpers/browser';

test.describe('/live/:id', () => {
  test('renders the live ranklist', async ({ page }) => {
    await stubWebSocket(page);

    await page.goto('/live/live-test-key');

    await expect(page).toHaveTitle(/Live: Test Contest 2024.*RankLand/, { timeout: 20_000 });
    await expect(page.locator('[data-id="live-ranklist-content"][data-ranklist-id="live-test-key"][data-row-count="2"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-id="live-scroll-solution-switch"]')).toBeVisible();
    await expect(page.getByRole('switch', { name: '实时滚动提交状态' })).toBeVisible();
    await expect(page.getByRole('switch', { name: '实时滚动提交状态' })).toHaveAttribute('data-state', 'unchecked');
  });
});
