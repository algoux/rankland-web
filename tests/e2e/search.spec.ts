import { expect, test } from '@playwright/test';

test.describe('/search', () => {
  test('initial state shows recent ranklists', async ({ page }) => {
    await page.goto('/search');

    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"]')).toHaveCount(1);
    await expect(page.locator('[data-id="search-ranklist-link"][href="/ranklist/test-key"]')).toHaveCount(1);

    await expect(page.getByRole('heading', { name: '在榜单数据库中探索' })).toHaveCSS('font-size', '16.38px');
    const searchControlMetrics = await page.evaluate(() => {
      const form = document.querySelector('.rankland-search-form');
      const input = document.querySelector('.rankland-search-input');
      const button = document.querySelector('.rankland-search-button');
      const section = document.querySelector('[data-id="search-recent-section"]');
      const list = document.querySelector('.rankland-search-list');
      const firstItem = document.querySelector('[data-id="search-ranklist-item"]');
      const items = document.querySelectorAll('[data-id="search-ranklist-item"]');
      const lastItem = items.item(items.length - 1);
      const firstTitle = firstItem?.querySelector('.rankland-search-list-item-title');
      const firstDate = firstItem?.querySelector('.rankland-search-list-date');
      if (!form || !input || !button || !section || !list || !firstItem || !lastItem || !firstTitle || !firstDate) {
        return null;
      }
      const clear = document.querySelector('.rankland-search-clear');
      const inputRect = input.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const formRect = form.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const itemRect = firstItem.getBoundingClientRect();
      const titleRect = firstTitle.getBoundingClientRect();
      const dateRect = firstDate.getBoundingClientRect();
      return {
        inputHeight: Math.round(inputRect.height),
        buttonHeight: Math.round(buttonRect.height),
        joined: Math.round(inputRect.right) === Math.round(buttonRect.left),
        sectionTopGap: Math.round(sectionRect.top - formRect.bottom),
        inputRadius: getComputedStyle(input).borderRadius,
        buttonRadius: getComputedStyle(button).borderRadius,
        buttonWidth: Math.round(buttonRect.width),
        clearVisible: clear ? getComputedStyle(clear).display !== 'none' : false,
        listBorder: getComputedStyle(list).borderWidth,
        firstItemPaddingTop: getComputedStyle(firstItem).paddingTop,
        firstItemBorderColor: getComputedStyle(firstItem).borderBottomColor,
        lastItemBorderWidth: getComputedStyle(lastItem).borderBottomWidth,
        dateRightInset: Math.round(itemRect.right - dateRect.right),
        dateToTitleGap: Math.round(dateRect.left - titleRect.right),
      };
    });
    expect(searchControlMetrics).toMatchObject({
      inputHeight: 32,
      buttonHeight: 32,
      joined: true,
      sectionTopGap: 40,
      inputRadius: '2px 0px 0px 2px',
      buttonRadius: '0px 2px 2px 0px',
      buttonWidth: 46,
      clearVisible: false,
      listBorder: '0px',
      firstItemPaddingTop: '8px',
      firstItemBorderColor: 'rgba(217, 217, 217, 0.45)',
      lastItemBorderWidth: '0px',
      dateRightInset: 0,
    });
    expect(searchControlMetrics?.dateToTitleGap).toBeGreaterThanOrEqual(16);
  });

  test('keyword search shows matched ranklists', async ({ page }) => {
    await page.goto('/search?kw=Test%20Contest');

    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"]')).toHaveCount(1);
    await expect(page.locator('[data-id="search-ranklist-item"][data-ranklist-key="noise-key"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '清除搜索' })).toBeVisible();
  });

  test('keeps the search input focused after pressing Enter', async ({ page }) => {
    await page.goto('/search');

    const input = page.locator('.rankland-search-input');
    await input.fill('Test Contest');
    await input.press('Enter');

    await expect(page).toHaveURL(/\/search\?kw=Test\+Contest|\/search\?kw=Test%20Contest/);
    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible({ timeout: 20_000 });
    await expect(input).toBeFocused();
  });
});
