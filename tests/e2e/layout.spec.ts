import { expect, test } from '@playwright/test';

test.describe('site layout', () => {
  test('keeps the header full width and restores the base antd typography', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto('/ranklist/test-key');

    const headerInset = await page.evaluate(() => {
      const rect = document.querySelector('[data-id="site-header-inner"]')?.getBoundingClientRect();
      if (!rect) {
        return null;
      }
      return {
        left: Math.round(rect.left),
        right: Math.round(window.innerWidth - rect.right),
      };
    });

    expect(headerInset).toEqual({ left: 50, right: 50 });
    await expect(page.locator('body')).toHaveCSS('font-size', '14px');
    await expect(page.locator('body')).toHaveCSS(
      'font-family',
      /-apple-system.*(BlinkMacSystemFont|system-ui).*Segoe UI.*Roboto.*Helvetica Neue.*Arial.*Noto Sans/,
    );
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).webkitFontSmoothing)).toBe('auto');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(242, 242, 242)');
    await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    const defaultLinkColor = await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'unstyled link';
      document.body.append(link);
      const color = getComputedStyle(link).color;
      link.remove();
      return color;
    });
    expect(defaultLinkColor).toBe('rgb(255, 129, 4)');
  });

  test('uses the original dark layout colors', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(20, 20, 20)');
  });

  test('keeps the header navigation close to the original antd horizontal menu', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=test-key');

    const collectionLink = page.getByRole('navigation').getByRole('link', { name: '榜单合集' });
    await expect(collectionLink).toHaveCSS('color', 'rgb(255, 129, 4)');
    await expect(page.getByRole('navigation').getByRole('link', { name: '探索' })).toHaveCSS('color', 'rgba(0, 0, 0, 0.85)');
    const activeIndicator = await collectionLink.evaluate((element) => {
      const itemRect = element.getBoundingClientRect();
      const afterStyle = getComputedStyle(element, '::after');
      return {
        itemWidth: Math.round(itemRect.width),
        indicatorWidth: Math.round(Number.parseFloat(afterStyle.width || '0')),
      };
    });
    expect(activeIndicator.indicatorWidth).toBeGreaterThan(40);
    expect(activeIndicator.indicatorWidth).toBeLessThan(activeIndicator.itemWidth);
    await expect(page.locator('details').filter({ hasText: '切换' })).toHaveCount(0);
    await expect(page.locator('[data-id="site-switch-menu"]')).toHaveCount(0);

    await page.getByRole('button', { name: '主题模式' }).click();
    const themeModeMenu = page.locator('[data-id="theme-mode-menu"]');
    await expect(themeModeMenu).toBeVisible();
    await expect(themeModeMenu.getByRole('menuitemradio', { name: /自动/ })).toHaveAttribute('data-state', 'checked');
    await expect(themeModeMenu.getByRole('menuitemradio', { name: /亮色/ })).toBeVisible();
    await expect(themeModeMenu.getByRole('menuitemradio', { name: /暗色/ })).toBeVisible();
  });

  test('keeps the theme mode menu open after a mobile tap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=test-key');

    await page.getByRole('button', { name: '主题模式' }).click();
    const themeModeMenu = page.locator('[data-id="theme-mode-menu"]');
    await expect(themeModeMenu).toBeVisible();
    await page.waitForTimeout(160);
    await expect(themeModeMenu).toBeVisible();
  });

  test('keeps restored ranklist metadata and theme menu hydration-clean', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        consoleMessages.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleMessages.push(error.message);
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=test-key');
    await expect(page.locator('[data-id="collection-ranklist-content"][data-row-count="2"]')).toBeVisible({
      timeout: 20_000,
    });

    expect(consoleMessages.filter((message) => /Hydration|mismatch/i.test(message))).toEqual([]);
  });
});
