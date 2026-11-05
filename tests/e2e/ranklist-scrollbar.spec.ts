import { expect, test } from './test';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test('keeps the navigation width stable while a ranklist modal is open with a classic scrollbar', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
  });
  await page.goto('/ranklist/large-key');
  await page.waitForFunction(() => document.body.dataset.ranklandHydrated === 'true');
  const user = page.getByText('Large Team 001', { exact: true });
  await expect(user).toBeVisible();
  const gutter = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
  test.skip(gutter === 0, 'The browser uses overlay scrollbars');

  const nav = page.locator('.rankland-nav-menu');
  const navWidth = () => nav.evaluate(element => element.getBoundingClientRect().width);
  const widthBeforeOpen = await navWidth();
  await user.click();
  await expect(page.locator('body')).toHaveClass(/srk-scrolling-effect/);
  expect(await navWidth()).toBe(widthBeforeOpen);

  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/srk-scrolling-effect/);
  expect(await navWidth()).toBe(widthBeforeOpen);
});
