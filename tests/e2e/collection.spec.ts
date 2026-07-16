import type { Page } from '@playwright/test';
import { expect, PUBLIC_CONTEST_VIEW_ROUTE, test } from './test';
import fs from 'node:fs';
import path from 'node:path';

async function delayRankInfoRequest(page: Page, rankKey: string, delayMs: number) {
  const escapedRankKey = rankKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.route(new RegExp(`/api/v2/public/contests/${escapedRankKey}(?:\\?.*)?$`), async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
    await route.fulfill({ response });
  });
}

async function readProgressSliderState(page: Page) {
  return page.locator('[data-id="ranklist-progress"] input.srk-progress-slider').evaluate((input) => ({
    max: Number((input as HTMLInputElement).max),
    value: Number((input as HTMLInputElement).value),
  }));
}

test.describe('/collection/:id', () => {
  test('keeps the full-bleed collection page shell independent of viewport width units', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/client/index.css'), 'utf-8');
    const pageShellRule = css.match(/\.rankland-collection-page\s*\{(?<body>[^}]*)\}/)?.groups?.body ?? '';

    expect(pageShellRule).not.toBe('');
    expect(pageShellRule).not.toContain('vw');
    expect(pageShellRule).toContain('--rankland-main-inline-padding');
  });

  test('renders the navigation menu and selected ranklist', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('.srk-collection-container')).toBeVisible();
    await expect(page.locator('.srk-collection-nav')).toBeVisible();
    await expect(page.locator('.srk-collection-hidden-header')).toBeVisible();
    await expect(page.locator('[data-id="collection-hidden-header"] img')).toHaveAttribute(
      'src',
      /rankland-logo/,
    );
    await expect(page.locator('.srk-collection-ranklist')).toBeVisible();
    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc-2026"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-ranklist-content"][data-row-count="2"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Contest 2024' })).toBeVisible();

    const gap = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-id="collection-sidebar"]')?.getBoundingClientRect();
      const ranklist = document.querySelector('[data-id="collection-ranklist-content"]')?.getBoundingClientRect();
      if (!sidebar || !ranklist) {
        return Number.NaN;
      }
      return Math.round(ranklist.left - sidebar.right);
    });
    expect(gap).toBe(0);

    const layout = await page.evaluate(() => {
      const hiddenHeader = document.querySelector('.srk-collection-hidden-header')?.getBoundingClientRect();
      const ranklistShell = document.querySelector('.srk-collection-ranklist')?.getBoundingClientRect();
      if (!hiddenHeader || !ranklistShell) {
        return null;
      }
      return {
        hiddenHeaderHeight: Math.round(hiddenHeader.height),
        ranklistTop: Math.round(ranklistShell.top),
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.hiddenHeaderHeight).toBe(64);
    expect(layout!.ranklistTop).toBeGreaterThanOrEqual(64);
  });

  test('reports one browser view for each completed collection selection, including A to B to A', async ({ page }) => {
    const reportedUKs: string[] = [];
    await page.unroute(PUBLIC_CONTEST_VIEW_ROUTE);
    await page.route(PUBLIC_CONTEST_VIEW_ROUTE, async (route) => {
      const match = new URL(route.request().url()).pathname.match(/\/contests\/([^/]+)\/views$/);
      if (match) {
        reportedUKs.push(decodeURIComponent(match[1]));
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, code: 0, data: null }),
      });
    });

    await page.goto('/collection/official?rankId=test-key');
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(300);
    expect(reportedUKs).toEqual([]);

    await page.locator('[data-id="collection-menu-item-another-key"]').click();
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="another-key"]')).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => reportedUKs).toEqual(['another-key']);

    await page.locator('[data-id="collection-menu-item-test-key"]').click();
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => reportedUKs).toEqual(['another-key', 'test-key']);
  });

  test('does not create document-level horizontal overflow from the full-bleed page shell', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 420 });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=test-key');
    await page.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' });

    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({
      timeout: 20_000,
    });

    const metrics = await page.evaluate(() => {
      const pageShell = document.querySelector('[data-id="collection-page"]')?.getBoundingClientRect();
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        pageShellLeft: pageShell ? Math.round(pageShell.left) : null,
        pageShellRight: pageShell ? Math.round(pageShell.right) : null,
      };
    });

    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    expect(metrics.pageShellLeft).toBe(0);
    expect(metrics.pageShellRight).toBeLessThanOrEqual(metrics.clientWidth);
  });

  test('restores the original expanded collection sidebar menu metrics', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toHaveCSS('color', 'rgb(246, 172, 6)');
    const metrics = await page.evaluate(() => {
      const pick = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) {
          return null;
        }
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const afterStyle = getComputedStyle(element, '::after');
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          background: style.backgroundColor,
          color: style.color,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          marginRight: style.marginRight,
          borderRightColor: style.borderRightColor,
          afterWidth: afterStyle.width,
          afterBackground: afterStyle.backgroundColor,
          src: element instanceof HTMLImageElement ? element.src : undefined,
        };
      };

      return {
        nav: pick('.srk-collection-nav'),
        toggle: pick('[data-id="collection-sidebar-toggle"]'),
        menu: pick('.srk-collection-nav-menu'),
        rootDirectory: pick('[data-id="collection-menu-item-dir-icpc"]'),
        secondLevelDirectory: pick('[data-id="collection-menu-item-dir-icpc-2026"]'),
        activeLeaf: pick('[data-id="collection-menu-item-test-key"]'),
        rootIconBox: pick('[data-id="collection-menu-item-dir-icpc"] .srk-collection-menu-icon'),
        rootIcon: pick('[data-id="collection-menu-item-dir-icpc"] .srk-collection-menu-icon img'),
      };
    });

    expect(metrics.nav).toMatchObject({
      width: 300,
      background: 'rgb(17, 17, 17)',
      borderRightColor: 'rgb(67, 67, 67)',
    });
    expect(metrics.toggle).toMatchObject({
      x: 0,
      width: 300,
      height: 40,
      background: 'rgba(0, 0, 0, 0)',
      fontSize: '16px',
      lineHeight: '25.144px',
      paddingLeft: '15px',
    });
    expect(metrics.menu).toMatchObject({ width: 299, background: 'rgb(20, 20, 20)' });
    expect(metrics.rootDirectory).toMatchObject({
      height: 40,
      color: 'rgb(246, 172, 6)',
      fontSize: '14px',
      lineHeight: '40px',
      paddingLeft: '24px',
      paddingRight: '4px',
    });
    expect(metrics.secondLevelDirectory).toMatchObject({
      height: 40,
      fontSize: '14px',
      lineHeight: '40px',
      paddingLeft: '48px',
    });
    expect(metrics.activeLeaf).toMatchObject({
      height: 40,
      background: 'rgb(42, 33, 17)',
      color: 'rgb(246, 172, 6)',
      fontSize: '14px',
      lineHeight: '40px',
      paddingLeft: '72px',
      paddingRight: '4px',
      afterWidth: '3px',
      afterBackground: 'rgb(246, 172, 6)',
    });
    expect(metrics.rootIconBox).toMatchObject({ width: 32, height: 40, marginRight: '10px' });
    expect(metrics.rootIcon).toMatchObject({ width: 32, height: 32 });
    expect(metrics.rootIcon?.src).toContain('icpc_logo_white');
  });

  test('restores the original expanded collection sidebar metrics in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toHaveCSS('color', 'rgb(255, 129, 4)');
    const metrics = await page.evaluate(() => {
      const pick = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) {
          return null;
        }
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const afterStyle = getComputedStyle(element, '::after');
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          background: style.backgroundColor,
          color: style.color,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          marginRight: style.marginRight,
          borderRightColor: style.borderRightColor,
          afterWidth: afterStyle.width,
          afterBackground: afterStyle.backgroundColor,
          src: element instanceof HTMLImageElement ? element.src : undefined,
        };
      };

      return {
        nav: pick('.srk-collection-nav'),
        toggle: pick('[data-id="collection-sidebar-toggle"]'),
        menu: pick('.srk-collection-nav-menu'),
        rootDirectory: pick('[data-id="collection-menu-item-dir-icpc"]'),
        activeLeaf: pick('[data-id="collection-menu-item-test-key"]'),
        rootIconBox: pick('[data-id="collection-menu-item-dir-icpc"] .srk-collection-menu-icon'),
        rootIcon: pick('[data-id="collection-menu-item-dir-icpc"] .srk-collection-menu-icon img'),
      };
    });

    expect(metrics.nav).toMatchObject({
      width: 300,
      background: 'rgb(244, 244, 244)',
      borderRightColor: 'rgb(217, 217, 217)',
    });
    expect(metrics.toggle).toMatchObject({
      width: 300,
      height: 40,
      background: 'rgb(255, 255, 255)',
      fontSize: '16px',
      lineHeight: '25.144px',
      paddingLeft: '15px',
    });
    expect(metrics.menu).toMatchObject({ width: 299, background: 'rgb(255, 255, 255)' });
    expect(metrics.rootDirectory).toMatchObject({
      height: 40,
      color: 'rgb(255, 129, 4)',
      fontSize: '14px',
      lineHeight: '40px',
      paddingLeft: '24px',
      paddingRight: '4px',
    });
    expect(metrics.activeLeaf).toMatchObject({
      height: 40,
      background: 'rgb(255, 247, 230)',
      color: 'rgb(255, 129, 4)',
      fontSize: '14px',
      lineHeight: '40px',
      paddingLeft: '72px',
      paddingRight: '4px',
      afterWidth: '3px',
      afterBackground: 'rgb(255, 129, 4)',
    });
    expect(metrics.rootIconBox).toMatchObject({ width: 32, height: 40, marginRight: '10px' });
    expect(metrics.rootIcon).toMatchObject({ width: 32, height: 32 });
    expect(metrics.rootIcon?.src).toContain('icpc_logo_black');
  });

  test('keeps a deep-linked active ranklist visible inside a scrollable long sidebar', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await page.goto('/collection/official?rankId=deep-key');

    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="deep-key"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-id="collection-ranklist-content"][data-row-count="2"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc-2010"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-menu-item-deep-key"]')).toBeVisible();

    const readScrollState = () => page.evaluate(() => {
      const menu = document.querySelector('.srk-collection-nav-menu');
      const activeItem = document.querySelector('[data-id="collection-menu-item-deep-key"]');
      if (!(menu instanceof HTMLElement) || !(activeItem instanceof HTMLElement)) {
        return null;
      }
      const menuRect = menu.getBoundingClientRect();
      const activeRect = activeItem.getBoundingClientRect();
      return {
        clientHeight: Math.round(menu.clientHeight),
        scrollHeight: Math.round(menu.scrollHeight),
        scrollTop: Math.round(menu.scrollTop),
        activeTop: Math.round(activeRect.top - menuRect.top),
        activeBottom: Math.round(activeRect.bottom - menuRect.top),
      };
    });

    await expect.poll(async () => {
      const state = await readScrollState();
      return Boolean(
        state
        && state.scrollHeight > state.clientHeight
        && state.scrollTop > 0
        && state.activeTop >= 0
        && state.activeBottom <= state.clientHeight,
      );
    }, { timeout: 3_000 }).toBe(true);

    const scrollState = await readScrollState();
    expect(scrollState).not.toBeNull();
    expect(scrollState!.scrollHeight).toBeGreaterThan(scrollState!.clientHeight);
    expect(scrollState!.scrollTop).toBeGreaterThan(0);
    expect(scrollState!.activeTop).toBeGreaterThanOrEqual(0);
    expect(scrollState!.activeBottom).toBeLessThanOrEqual(scrollState!.clientHeight);
  });

  test('supports expanded submenu toggles, collapsed flyout selection, and persistence', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc"]')).toHaveCSS('color', 'rgb(246, 172, 6)');
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc-2026"]')).toHaveCSS('color', 'rgb(246, 172, 6)');
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc-2026"]')).toHaveAttribute('aria-expanded', 'true');
    const submenuTransition = await page.evaluate(() => {
      const submenu = document.querySelector('[data-id="collection-submenu-dir-icpc-2026"]');
      if (!(submenu instanceof HTMLElement)) {
        return null;
      }
      const style = getComputedStyle(submenu);
      return {
        overflow: style.overflow,
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
      };
    });
    expect(submenuTransition).toMatchObject({
      overflow: 'hidden',
      transitionProperty: 'height, opacity',
      transitionDuration: '0.22s, 0.18s',
    });
    await page.locator('[data-id="collection-menu-item-dir-icpc-2026"]').click();
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc-2026"]')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc-2026"]')).toHaveCSS('color', 'rgb(246, 172, 6)');
    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toBeHidden();
    await page.locator('[data-id="collection-menu-item-dir-icpc-2026"]').click();
    await expect(page.locator('[data-id="collection-menu-item-test-key"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-menu-item-icpc-2025-regional"]')).toBeHidden();
    await page.locator('[data-id="collection-menu-item-dir-icpc-2025"]').click();
    await page.locator('[data-id="collection-submenu-dir-icpc-2025"]').waitFor({ state: 'attached' });
    const openingAnimationStart = await page.evaluate(async () => {
      const submenu = document.querySelector('[data-id="collection-submenu-dir-icpc-2025"]');
      if (!(submenu instanceof HTMLElement)) {
        return null;
      }
      const readHeight = () => Number.parseFloat(getComputedStyle(submenu).height);
      const heightSamples = [readHeight()];
      await new Promise((resolve) => {
        setTimeout(resolve, 40);
      });
      heightSamples.push(readHeight());
      await new Promise((resolve) => {
        setTimeout(resolve, 40);
      });
      heightSamples.push(readHeight());
      return {
        inlineHeight: submenu.style.height,
        inlineOpacity: submenu.style.opacity,
        scrollHeight: submenu.scrollHeight,
        heightSamples,
      };
    });
    expect(openingAnimationStart).not.toBeNull();
    expect(openingAnimationStart!.scrollHeight).toBeGreaterThan(0);
    expect(openingAnimationStart).toMatchObject({
      inlineHeight: `${openingAnimationStart!.scrollHeight}px`,
      inlineOpacity: '1',
    });
    expect(openingAnimationStart!.heightSamples.some((height) => (
      height > 0 && height < openingAnimationStart!.scrollHeight
    ))).toBe(true);
    await page.waitForTimeout(90);
    const openingAnimationProgress = await page.evaluate(() => {
      const submenu = document.querySelector('[data-id="collection-submenu-dir-icpc-2025"]');
      if (!(submenu instanceof HTMLElement)) {
        return null;
      }
      return {
        computedHeight: Number.parseFloat(getComputedStyle(submenu).height),
        inlineHeight: submenu.style.height,
        scrollHeight: submenu.scrollHeight,
      };
    });
    expect(openingAnimationProgress).not.toBeNull();
    expect(openingAnimationProgress!.computedHeight).toBeGreaterThan(0);
    expect(openingAnimationProgress!.computedHeight).toBeLessThanOrEqual(openingAnimationProgress!.scrollHeight);
    expect(openingAnimationProgress!.inlineHeight).toBe(`${openingAnimationProgress!.scrollHeight}px`);
    await expect(page.locator('[data-id="collection-menu-item-icpc-2025-regional"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const submenu = document.querySelector('[data-id="collection-submenu-dir-icpc-2025"]');
      return submenu instanceof HTMLElement ? submenu.style.height : null;
    })).toBe('');
    await page.mouse.move(700, 500);
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc-2025"]')).toHaveCSS('color', 'rgba(255, 255, 255, 0.85)');
    await page.locator('[data-id="collection-menu-item-dir-icpc-2025"]').click();
    await page.waitForTimeout(60);
    const closingAnimationState = await page.evaluate(() => {
      const submenu = document.querySelector('[data-id="collection-submenu-dir-icpc-2025"]');
      if (!(submenu instanceof HTMLElement)) {
        return null;
      }
      return {
        inlineHeight: submenu.style.height,
        inlineOpacity: submenu.style.opacity,
      };
    });
    expect(closingAnimationState).toMatchObject({
      inlineHeight: '0px',
      inlineOpacity: '0',
    });
    await expect(page.locator('[data-id="collection-submenu-dir-icpc-2025"]')).toBeHidden();
    await expect(page.locator('[data-id="collection-menu-item-icpc-2025-regional"]')).toBeHidden();

    await page.locator('[data-id="collection-sidebar-toggle"]').click();
    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveClass(/is-collapsed/);
    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '80px');
    await expect(page.locator('[data-id="collection-menu-item-dir-icpc"] .srk-collection-menu-label')).toHaveCount(1);
    await page.locator('[data-id="collection-menu-item-dir-icpc"]').hover();
    await expect(page.locator('[data-id="collection-collapsed-popup-dir-icpc"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-collapsed-popup-dir-icpc"]')).toContainText('Another Contest');
    await page.locator('[data-id="collection-menu-item-dir-ccpc"]').hover();
    await expect(page.locator('[data-id="collection-collapsed-popup-dir-ccpc"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-collapsed-popup-dir-icpc"]')).toBeHidden();
    await page.locator('[data-id="collection-menu-item-dir-icpc"]').hover();
    await expect(page.locator('[data-id="collection-collapsed-popup-dir-icpc"]')).toBeVisible();

    await page.locator('[data-id="collection-collapsed-popup-dir-icpc"] [data-id="collection-menu-item-another-key"]').click();
    await expect(page).toHaveURL(/rankId=another-key/);
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="another-key"]')).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('CollectionNavCollapsed'))).toBe('true');

    await page.reload();
    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '80px');
  });

  test('starts collapsed on mobile and keeps the expanded sidebar inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 260, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '80px');
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.locator('[data-id="collection-sidebar-toggle"]').click();
    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '260px');
    const expandedMobileWidth = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-id="collection-sidebar"]')?.getBoundingClientRect();
      const toggle = document.querySelector('[data-id="collection-sidebar-toggle"]')?.getBoundingClientRect();
      const menu = document.querySelector('.srk-collection-nav-menu')?.getBoundingClientRect();
      return {
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        sidebarWidth: sidebar ? Math.round(sidebar.width) : null,
        sidebarRight: sidebar ? Math.round(sidebar.right) : null,
        toggleWidth: toggle ? Math.round(toggle.width) : null,
        menuWidth: menu ? Math.round(menu.width) : null,
      };
    });
    expect(expandedMobileWidth).toMatchObject({
      viewportWidth: 260,
      scrollWidth: 260,
      sidebarWidth: 260,
      sidebarRight: 260,
      toggleWidth: 260,
      menuWidth: 259,
    });
    await page.locator('[data-id="collection-sidebar-toggle"]').click();
    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '80px');
    await page.locator('[data-id="collection-menu-item-dir-icpc"]').click();
    const popup = page.locator('[data-id="collection-collapsed-popup-dir-icpc"]');
    await expect(popup).toBeVisible();
    await expect(popup).toContainText('Test Contest 2024');
    await popup.locator('[data-id="collection-menu-item-dir-icpc-2025"]').click();
    await expect(popup).toBeVisible();
    await expect(popup.locator('[data-id="collection-menu-item-icpc-2025-regional"]')).toBeVisible();
    await popup.locator('[data-id="collection-menu-item-test-key"]').click();
    await expect(popup).toBeHidden();
  });

  test('keeps wide ranklist tables in page-level overflow for mobile browser zoom', async ({ page }) => {
    await page.setViewportSize({ width: 260, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '80px');
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({
      timeout: 20_000,
    });

    const overflowMetrics = await page.evaluate(() => {
      const table = document.querySelector('.srk-main table')?.getBoundingClientRect();
      const tableScroll = document.querySelector('.srk-ranklist-table-scroll');
      const tableScrollStyle = tableScroll ? getComputedStyle(tableScroll) : null;
      return {
        viewportWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        tableRight: table ? Math.round(table.right) : 0,
        tableWidth: table ? Math.round(table.width) : 0,
        tableScrollOverflowX: tableScrollStyle?.overflowX ?? '',
      };
    });

    expect(overflowMetrics.viewportWidth).toBe(260);
    expect(overflowMetrics.tableWidth).toBeGreaterThan(overflowMetrics.viewportWidth);
    expect(overflowMetrics.tableRight).toBeGreaterThan(overflowMetrics.viewportWidth);
    expect(overflowMetrics.documentScrollWidth).toBeGreaterThan(overflowMetrics.viewportWidth);
    expect(overflowMetrics.bodyScrollWidth).toBeGreaterThan(overflowMetrics.viewportWidth);
    expect(overflowMetrics.tableScrollOverflowX).toBe('visible');
  });

  test('uses full-width expanded sidebar on narrow mobile layouts', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '80px');
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.locator('[data-id="collection-sidebar-toggle"]').click();
    await expect(page.locator('[data-id="collection-sidebar"]')).toHaveCSS('width', '600px');
    const expandedMobileWidth = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-id="collection-sidebar"]')?.getBoundingClientRect();
      const toggle = document.querySelector('[data-id="collection-sidebar-toggle"]')?.getBoundingClientRect();
      const menu = document.querySelector('.srk-collection-nav-menu')?.getBoundingClientRect();
      return {
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        sidebarWidth: sidebar ? Math.round(sidebar.width) : null,
        sidebarRight: sidebar ? Math.round(sidebar.right) : null,
        toggleWidth: toggle ? Math.round(toggle.width) : null,
        menuWidth: menu ? Math.round(menu.width) : null,
      };
    });
    expect(expandedMobileWidth).toMatchObject({
      viewportWidth: 600,
      scrollWidth: 600,
      sidebarWidth: 600,
      sidebarRight: 600,
      toggleWidth: 600,
      menuWidth: 599,
    });
  });

  test('keeps the previous ranklist visible while switching to a slow collection item', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await delayRankInfoRequest(page, 'another-key', 900);
    await page.goto('/collection/official?rankId=test-key');

    const currentRanklist = page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="test-key"]');
    await expect(currentRanklist).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Test Contest 2024' })).toBeVisible();

    await page.locator('[data-id="collection-menu-item-another-key"]').click();
    await page.waitForTimeout(120);
    await expect(currentRanklist).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Contest 2024' })).toBeVisible();
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="another-key"]')).toHaveCount(0);

    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="another-key"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).toHaveURL(/rankId=another-key/);
  });

  test('scrolls back to the top after switched collection ranklist data is ready', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await delayRankInfoRequest(page, 'another-key', 900);
    await page.goto('/collection/official?rankId=large-key');

    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="large-key"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(0);

    await page.locator('[data-id="collection-menu-item-another-key"]').click();
    await page.waitForTimeout(120);
    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="large-key"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(0);

    await expect(page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="another-key"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).toHaveURL(/rankId=another-key/);
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  });

  test('resets the progress time-travel slider after switching collection ranklists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.removeItem('CollectionNavCollapsed');
    });
    await page.goto('/collection/official?rankId=short-progress-key');

    await expect(
      page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="short-progress-key"]'),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="ranklist-progress"] input.srk-progress-slider')).toBeVisible();
    await expect.poll(() => readProgressSliderState(page)).toEqual({ max: 180, value: 180 });

    await page.evaluate(() => {
      window.history.pushState({}, '', '/collection/official?rankId=long-progress-key');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(
      page.locator('[data-id="collection-ranklist-content"][data-ranklist-id="long-progress-key"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/rankId=long-progress-key/);
    await expect.poll(() => readProgressSliderState(page)).toEqual({ max: 300, value: 300 });
  });

  test('keeps the hidden collection header and ranklist table header sticky while scrolling', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/collection/official?rankId=large-key');

    await expect(page.locator('[data-id="collection-ranklist-content"][data-row-count="384"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(100);

    const stickyPositions = await page.evaluate(() => {
      const hiddenHeader = document.querySelector('.srk-collection-hidden-header')?.getBoundingClientRect();
      const tableHeader = document.querySelector('.srk-main thead th')?.getBoundingClientRect();
      if (!hiddenHeader || !tableHeader) {
        return null;
      }
      return {
        hiddenHeaderTop: Math.round(hiddenHeader.top),
        tableHeaderTop: Math.round(tableHeader.top),
        scrollY: Math.round(window.scrollY),
      };
    });

    expect(stickyPositions).not.toBeNull();
    expect(stickyPositions!.scrollY).toBeGreaterThan(0);
    expect(stickyPositions!.hiddenHeaderTop).toBeGreaterThanOrEqual(0);
    expect(stickyPositions!.hiddenHeaderTop).toBeLessThanOrEqual(65);
    expect(stickyPositions!.tableHeaderTop).toBeGreaterThanOrEqual(0);
    expect(stickyPositions!.tableHeaderTop).toBeLessThanOrEqual(65);
  });

  test('prompts to select a ranklist when no rankId in URL', async ({ page }) => {
    await page.goto('/collection/official');

    await expect(page.locator('[data-id="collection-empty-state"]')).toBeVisible({ timeout: 20_000 });
  });

  test('uses the original RankLand favicon', async () => {
    const currentFavicon = fs.readFileSync(path.join(process.cwd(), 'public/favicon.ico'));
    const originalFavicon = fs.readFileSync(path.resolve(process.cwd(), '../rankland-fe/public/favicon.ico'));

    expect(currentFavicon.equals(originalFavicon)).toBe(true);
  });
});
