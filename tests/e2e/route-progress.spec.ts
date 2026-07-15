import type { Page } from '@playwright/test';
import { expect, test } from './test';

test.describe('route navigation progress', () => {
  test('shows the themed top bar while route chunks are loading', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const chunkRequest = createManualGate();
    await page.route(/\/assets\/.*\.js(\?.*)?$/, async (route) => {
      if (!chunkRequest.started) {
        chunkRequest.started = true;
        chunkRequest.resolveStarted();
        await chunkRequest.waitForRelease();
      }
      await route.continue();
    });

    await page.getByRole('navigation').getByRole('link', { name: '演练场' }).click();
    await chunkRequest.waitForStart();

    const bar = page.locator('#nprogress .bar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveCSS('background-color', 'rgb(255, 129, 4)');

    chunkRequest.release();
    await expect(page).toHaveTitle('Playground | RankLand');
    await expect(bar).toHaveCount(0);
  });

  test('stays visible through asyncData and follows forced dark theme color', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      window.localStorage.setItem('RanklandThemeMode', 'dark');
    });

    await page.goto('/');
    await waitForHydration(page);
    await expect(page.locator('html')).toHaveClass(/dark/);

    const contestsRequest = createManualGate();
    await page.route(/\/api\/v2\/public\/contests(?:\?.*)?$/, async (route) => {
      contestsRequest.started = true;
      contestsRequest.resolveStarted();
      await contestsRequest.waitForRelease();
      await route.continue();
    });

    await page.getByRole('navigation').getByRole('link', { name: '探索' }).click();
    await contestsRequest.waitForStart();

    const bar = page.locator('#nprogress .bar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveCSS('background-color', 'rgb(246, 172, 6)');

    contestsRequest.release();
    await expect(page).toHaveTitle('探索 | RankLand');
    await expect(bar).toHaveCount(0);
  });
});

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.body.dataset.ranklandHydrated === 'true');
}

function createManualGate() {
  let resolveStarted!: () => void;
  let release!: () => void;
  const startPromise = new Promise<void>((resolve) => {
    resolveStarted = resolve;
  });
  const releasePromise = new Promise<void>((resolve) => {
    release = resolve;
  });

  return {
    started: false,
    release,
    resolveStarted,
    waitForRelease: () => releasePromise,
    waitForStart: () => startPromise,
  };
}
