import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const MOCK_API_PORT = Number(process.env.E2E_MOCK_API_PORT || 4322);
const MOCK_API_BASE = `http://127.0.0.1:${MOCK_API_PORT}`;

async function expectPopoverPaintedOnTop(page: Page, dataId: string) {
  const paintState = await page.locator(`[data-id="${dataId}"]`).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2, 1), window.innerWidth - 1);
    const y = Math.min(Math.max(rect.top + rect.height / 2, 1), window.innerHeight - 1);
    const topElement = document.elementFromPoint(x, y);
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      containsTopElement: topElement === element || element.contains(topElement),
      height: Math.round(rect.height),
      opacity: Number.parseFloat(style.opacity),
      visibility: style.visibility,
      width: Math.round(rect.width),
      zIndex: Number.parseInt(style.zIndex, 10),
    };
  });
  expect(paintState.width).toBeGreaterThan(20);
  expect(paintState.height).toBeGreaterThan(10);
  expect(paintState.visibility).toBe('visible');
  expect(paintState.opacity).toBeGreaterThan(0.9);
  expect(paintState.zIndex).toBeGreaterThanOrEqual(1000);
  expect(paintState.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(paintState.containsTopElement).toBe(true);
}

test.describe('/ranklist/:id', () => {
  test('renders the ranklist with mocked data', async ({ page }) => {
    await page.goto('/ranklist/test-key');

    await expect(page).toHaveTitle(/Test Contest 2024.*RankLand/, { timeout: 20_000 });
    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('.srk-ranklist-client-render-region')).toHaveCount(0);
  });

  test('keeps request-language SSR output hydration-clean and cache-isolated', async ({ browser, baseURL }) => {
    const enContext = await browser.newContext({
      baseURL,
      locale: 'en-US',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const zhContext = await browser.newContext({
      baseURL,
      locale: 'zh-CN',
      extraHTTPHeaders: {
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    const hydrationMessages: string[] = [];

    try {
      const enPage = await enContext.newPage();
      enPage.on('console', (message) => {
        const text = message.text();
        if (/hydration|mismatch/i.test(text)) {
          hydrationMessages.push(`en: ${text}`);
        }
      });
      await enPage.goto('/ranklist/localized-key-v2');
      await expect(enPage.getByRole('heading', { name: 'Localized Contest' })).toBeVisible({ timeout: 20_000 });
      await expect(enPage.getByText('Localized Team')).toBeVisible();
      await expect(enPage.getByText('中文本地化比赛')).toHaveCount(0);

      const zhPage = await zhContext.newPage();
      zhPage.on('console', (message) => {
        const text = message.text();
        if (/hydration|mismatch/i.test(text)) {
          hydrationMessages.push(`zh: ${text}`);
        }
      });
      await zhPage.goto('/ranklist/localized-key-v2');
      await expect(zhPage.getByRole('heading', { name: '中文本地化比赛' })).toBeVisible({ timeout: 20_000 });
      await expect(zhPage.getByText('中文队伍')).toBeVisible();
      await expect(zhPage.getByText('Localized Team')).toHaveCount(0);
    } finally {
      await enContext.close();
      await zhContext.close();
    }

    expect(hydrationMessages).toEqual([]);
  });

  test('reveals the page after the initial ranklist preference remount', async ({ page }) => {
    const hydrationMessages: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (/hydration|mismatch/i.test(text)) {
        hydrationMessages.push(text);
      }
    });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.setItem('StyledRanklistSettings', JSON.stringify({
        professionalMode: true,
        statusCellPreset: 'minimal',
        statusColorAsText: true,
        rowStriped: false,
        tableBordered: true,
        emptyStatusPlaceholder: 'dash',
        splitOrganization: true,
        userAvatarPlacement: 'user',
      }));
    });

    await page.goto('/ranklist/test-key');
    await page.waitForFunction(() => document.body.dataset.ranklandHydrated === 'true');
    await page.waitForFunction(() => getComputedStyle(document.body).opacity === '1');
    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]')).toBeVisible({
      timeout: 20_000,
    });

    const renderedState = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.srk-main thead th')).map((header) =>
        header.textContent?.trim() || '',
      );
      return {
        bodyOpacity: getComputedStyle(document.body).opacity,
        hasDirtColumn: headers.includes('Dirt'),
        hasOrganizationColumn: headers.includes('Organization'),
        hasSEColumn: headers.includes('SE'),
        hasProblemStatisticsFooter: Boolean(document.querySelector('.srk-problem-statistics-footer-row')),
        hasLegacyRanklistGate: Boolean(document.querySelector('.srk-ranklist-client-render-region')),
      };
    });

    expect(renderedState).toEqual({
      bodyOpacity: '1',
      hasDirtColumn: true,
      hasOrganizationColumn: true,
      hasSEColumn: true,
      hasProblemStatisticsFooter: true,
      hasLegacyRanklistGate: false,
    });
    expect(hydrationMessages).toEqual([]);
  });

  test('hides the problem statistics footer in professional mode when the ranklist has no problems', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.setItem('StyledRanklistSettings', JSON.stringify({
        professionalMode: true,
        statusCellPreset: 'minimal',
        statusColorAsText: true,
        rowStriped: false,
        tableBordered: true,
        emptyStatusPlaceholder: 'dash',
        splitOrganization: true,
        userAvatarPlacement: 'user',
      }));
    });

    await page.goto('/ranklist/no-problems-key');
    await page.waitForFunction(() => document.body.dataset.ranklandHydrated === 'true');
    await page.waitForFunction(() => getComputedStyle(document.body).opacity === '1');
    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="no-problems-key"][data-row-count="2"]')).toBeVisible({
      timeout: 20_000,
    });

    const renderedState = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.srk-main thead th')).map((header) =>
        header.textContent?.trim() || '',
      );
      return {
        hasDirtColumn: headers.includes('Dirt'),
        hasProblemColumn: headers.includes('A'),
        hasProblemStatisticsFooter: Boolean(document.querySelector('.srk-problem-statistics-footer-row')),
        hasSEColumn: headers.includes('SE'),
      };
    });

    expect(renderedState).toEqual({
      hasDirtColumn: false,
      hasProblemColumn: false,
      hasProblemStatisticsFooter: false,
      hasSEColumn: false,
    });
  });

  test('uses the shared Button component in the settings intro modal', async ({ page }) => {
    await page.goto('/ranklist/test-key');

    await expect(page.getByText('现可自定义榜单的显示样式！')).toBeVisible({ timeout: 20_000 });
    const intro = page.locator('.srk-ranklist-settings-intro');
    await expect(intro).toBeVisible();
    const okButton = intro.getByRole('button', { name: 'OK' });
    await expect(okButton).toBeVisible();

    const buttonState = await okButton.evaluate((button) => ({
      className: button.getAttribute('class') || '',
    }));
    expect(buttonState.className).toContain('inline-flex');
    expect(buttonState.className).toContain('h-9');
    expect(buttonState.className).toContain('px-4');
    expect(buttonState.className).toContain('py-2');
    expect(buttonState.className).not.toContain('h-8');
    expect(buttonState.className).not.toContain('px-3');
    expect(buttonState.className).not.toContain('py-1.5');
    expect(buttonState.className).not.toContain('text-xs');

    await okButton.click();
    await expect(intro).toBeHidden();
  });

  test('hides the leading metadata divider when the view count is absent', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/no-view-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="no-view-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.srk-ranklist-meta-item')).toHaveCount(0);
    await expect(page.locator('.srk-ranklist-meta-divider')).toHaveCount(2);
    const metaLayout = await page.evaluate(() => {
      const meta = document.querySelector('.srk-ranklist-meta');
      const dividers = Array.from(document.querySelectorAll('.srk-ranklist-meta-divider'));
      const download = document.querySelector('[data-id="ranklist-download-action"]');
      const edit = document.querySelector('[data-id="ranklist-edit-srk-action"]');
      const share = document.querySelector('[data-id="ranklist-share-action"]');
      if (!meta || dividers.length !== 2 || !download || !edit || !share) {
        return null;
      }
      const firstDividerRect = dividers[0].getBoundingClientRect();
      const secondDividerRect = dividers[1].getBoundingClientRect();
      const downloadRect = download.getBoundingClientRect();
      const editRect = edit.getBoundingClientRect();
      const shareRect = share.getBoundingClientRect();
      return {
        firstDividerAfterEdit: firstDividerRect.left > editRect.right,
        firstDividerBeforeDownload: firstDividerRect.right < downloadRect.left,
        secondDividerAfterDownload: secondDividerRect.left > downloadRect.right,
        secondDividerBeforeShare: secondDividerRect.right < shareRect.left,
        firstMetaElementIsEdit: meta.firstElementChild === edit,
      };
    });
    expect(metaLayout).toEqual({
      firstDividerAfterEdit: true,
      firstDividerBeforeDownload: true,
      secondDividerAfterDownload: true,
      secondDividerBeforeShare: true,
      firstMetaElementIsEdit: true,
    });
  });

  test('opens playground editor with the current srk source URL', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    const editAction = page.locator('[data-id="ranklist-edit-srk-action"]');
    await expect(editAction).toBeVisible();
    await expect(editAction).toHaveAttribute('aria-label', '编辑 srk');
    await editAction.hover();
    await expect(page.locator('[data-id="ranklist-edit-srk-tooltip"]')).toHaveText('在演练场中编辑 srk');

    await editAction.click();
    await expect(page).toHaveURL(/\/playground\?/);
    const playgroundQuery = await page.evaluate(() => {
      const url = new URL(window.location.href);
      return {
        path: url.pathname,
        id: url.searchParams.get('id'),
        src: url.searchParams.get('src'),
      };
    });

    expect(playgroundQuery).toEqual({
      path: '/playground',
      id: 'test-key',
      src: `${MOCK_API_BASE}/file/download?id=file-test-1`,
    });
  });

  test('shows a plain export hint as the first download menu item', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    await page.locator('[data-id="ranklist-download-action"]').hover();
    await expect(page.locator('[data-id="ranklist-download-menu"]')).toBeVisible();
    const downloadMenuIntro = page.locator('[data-id="ranklist-download-menu-label"]');
    await expect(downloadMenuIntro).toHaveText('导出为...');
    const downloadMenuIntroState = await page.locator('[data-id="ranklist-download-menu"]').evaluate((menu) => {
      const label = menu.querySelector('[data-id="ranklist-download-menu-label"]');
      return {
        isFirstMenuChild: label?.parentElement?.firstElementChild === label,
        hasInteractiveChild: Boolean(label?.querySelector('button, a')),
      };
    });
    expect(downloadMenuIntroState).toEqual({
      isFirstMenuChild: true,
      hasInteractiveChild: false,
    });
  });

  test('restores ranklist toolbar and title metadata interactions', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('select.srk-ranklist-org-select')).toHaveCount(0);
    await expect(page.locator('[data-id="ranklist-org-multi-select"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-org-multi-select"]')).toContainText('选择组织/单位');
    await page.locator('[data-id="ranklist-org-multi-select"]').click();
    await expect(page.locator('[data-id="ranklist-org-search"]')).toBeVisible();
    await expect(page.locator('.srk-multi-select-options')).toHaveAttribute('aria-multiselectable', 'true');
    const optionOverflowStyle = await page.locator('.srk-multi-select-option-label').first().evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      };
    });
    expect(optionOverflowStyle).toEqual({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
    const optionScrollWidth = await page.locator('.srk-multi-select-options').evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(optionScrollWidth.scrollWidth).toBeLessThanOrEqual(optionScrollWidth.clientWidth);
    const selectWidths = await page.evaluate(() => {
      const trigger = document.querySelector('[data-id="ranklist-org-multi-select"]')?.getBoundingClientRect();
      const dropdown = document.querySelector('.srk-multi-select-dropdown')?.getBoundingClientRect();
      if (!trigger || !dropdown) {
        return null;
      }
      return {
        trigger: Math.round(trigger.width),
        dropdown: Math.round(dropdown.width),
      };
    });
    expect(selectWidths).toEqual({ trigger: 180, dropdown: 180 });
    await page.locator('[data-id="ranklist-org-search"]').fill('Beta');
    await page.locator('[data-id="ranklist-org-option-Beta University"]').click();
    await expect(page.locator('[data-id="ranklist-org-selected-count"]')).toHaveText('已选择 1 个');
    await expect(page.getByText('Team Alpha')).toHaveCount(0);
    await expect(page.getByText('Team Beta')).toBeVisible();
    await page.locator('[data-id="ranklist-org-search"]').fill('');
    await page.locator('[data-id="ranklist-org-option-Alpha University"]').click();
    await expect(page.locator('[data-id="ranklist-org-selected-count"]')).toHaveText('已选择 2 个');
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.getByText('Team Beta')).toBeVisible();
    await page.locator('[data-id="ranklist-org-clear"]').click();
    await expect(page.locator('[data-id="ranklist-org-multi-select"]')).toContainText('选择组织/单位');

    await expect(page.getByRole('switch', { name: '仅正式参赛' })).toBeVisible();
    await expect(page.locator('[data-id="ranklist-marker-toggle-group"]')).toHaveAttribute('role', 'group');
    await expect(page.locator('[data-id="ranklist-marker-toggle-group"] button')).toHaveCount(2);
    await expect(page.getByRole('button', { name: '全部' })).toHaveAttribute('data-state', 'on');
    const activeMarkerButton = page.locator('[data-id="ranklist-marker-toggle-group"] button[data-state="on"]');
    const inactiveMarkerButton = page.locator('[data-id="ranklist-marker-toggle-group"] button[data-state="off"]').first();
    await activeMarkerButton.hover();
    const activeMarkerHoverBg = await activeMarkerButton.evaluate((element) => getComputedStyle(element).backgroundColor);
    await inactiveMarkerButton.hover();
    const inactiveMarkerHoverBg = await inactiveMarkerButton.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(activeMarkerHoverBg).not.toBe(inactiveMarkerHoverBg);
    await expect(page.locator('[data-id="ranklist-progress"]')).toBeVisible();
    await expect(page.locator('.srk-ranklist-title')).toHaveCSS('font-size', '28px');
    await expect(page.locator('.srk-ranklist-title')).toHaveCSS('font-weight', '500');

    await expect(page.getByRole('link', { name: 'XCPCIO' })).toHaveCSS('color', 'rgb(255, 129, 4)');
    await expect(page.getByRole('link', { name: 'algoUX' })).toHaveCSS('color', 'rgb(255, 129, 4)');
    await page.locator('[data-id="ranklist-download-action"]').hover();
    await expect(page.locator('[data-id="ranklist-download-menu"]')).toBeVisible();
    const downloadMenuWidth = await page.locator('[data-id="ranklist-download-menu"]').evaluate((menu) => {
      const widths = Array.from(menu.querySelectorAll('button, a')).map((item) => item.scrollWidth);
      return {
        menu: Math.round(menu.getBoundingClientRect().width),
        widestItem: Math.max(...widths),
      };
    });
    expect(downloadMenuWidth.menu).toBeGreaterThan(downloadMenuWidth.widestItem);
    expect(downloadMenuWidth.menu).toBeGreaterThan(190);
    const downloadMenuGap = await page.evaluate(() => {
      const trigger = document.querySelector('[data-id="ranklist-download-action"]')?.getBoundingClientRect();
      const menu = document.querySelector('[data-id="ranklist-download-menu"]')?.getBoundingClientRect();
      if (!trigger || !menu) {
        return Number.NaN;
      }
      return Math.round(menu.top - trigger.bottom);
    });
    expect(downloadMenuGap).toBeLessThanOrEqual(1);
    await page.locator('[data-id="ranklist-download-menu"]').getByRole('menuitem', { name: '标准榜单格式 (srk)' }).hover();
    await expect(page.locator('[data-id="ranklist-download-menu"]')).toBeVisible();
    await page.locator('[data-id="ranklist-download-menu"]').getByRole('menuitem', { name: '标准榜单格式 (srk)' }).click();
    await expect(page.locator('[data-id="ranklist-download-menu"]')).toBeHidden();
    await page.locator('[data-id="ranklist-share-action"]').hover();
    await expect(page.locator('[data-id="ranklist-share-menu"]')).toBeVisible();
    const shareMenuWidth = await page.locator('[data-id="ranklist-share-menu"]').evaluate((menu) => {
      const widths = Array.from(menu.querySelectorAll('button, a')).map((item) => item.scrollWidth);
      return {
        menu: Math.round(menu.getBoundingClientRect().width),
        widestItem: Math.max(...widths),
      };
    });
    expect(shareMenuWidth.menu).toBeGreaterThan(shareMenuWidth.widestItem);
    expect(shareMenuWidth.menu).toBeLessThan(190);
    const shareMenuGap = await page.evaluate(() => {
      const trigger = document.querySelector('[data-id="ranklist-share-action"]')?.getBoundingClientRect();
      const menu = document.querySelector('[data-id="ranklist-share-menu"]')?.getBoundingClientRect();
      if (!trigger || !menu) {
        return Number.NaN;
      }
      return Math.round(menu.top - trigger.bottom);
    });
    expect(shareMenuGap).toBeLessThanOrEqual(1);
    await page.locator('[data-id="ranklist-share-menu"]').getByRole('menuitem', { name: '复制本页链接' }).hover();
    await expect(page.locator('[data-id="ranklist-share-menu"]')).toBeVisible();
    await page.locator('[data-id="ranklist-share-menu"]').getByRole('menuitem', { name: '复制本页链接' }).click();
    await expect(page.locator('[data-id="ranklist-share-menu"]')).toBeHidden();
    const successToast = page.locator('[data-sonner-toast][data-type="success"]');
    await expect(successToast).toContainText('链接已复制');
    const successIcon = successToast.locator('svg.rankland-sonner-success-icon');
    await expect(successIcon).toHaveClass(/rankland-sonner-status-icon/);
    await expect(successIcon).toHaveCSS('color', 'rgb(34, 197, 94)');
    await expect(page.locator('[data-id="global-message"]')).toHaveCount(0);
    await expect(page.locator('.srk-ranklist-copied-notice')).toHaveCount(0);
    await page.locator('[data-id="ranklist-ref-links-more"]').hover();
    await expect(page.locator('[data-id="ranklist-ref-links-menu"]')).toBeVisible();
    await page.locator('[data-id="ranklist-ref-links-menu"]').getByRole('menuitem', { name: 'Standings' }).hover();
    await expect(page.locator('[data-id="ranklist-ref-links-menu"]')).toBeVisible();
  });

  test('uses the dark Sonner theme for share feedback in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('.srk-remarks')).toContainText('Mock contest remark');
    await expect(page.locator('.srk-remarks')).toHaveCSS('border-color', 'rgba(246, 172, 6, 0.8)');
    const toaster = page.locator('[data-sonner-toaster]');
    await expect(toaster).toHaveAttribute('data-sonner-theme', 'dark');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await expect(toaster).toHaveAttribute('data-sonner-theme', 'light');
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await expect(toaster).toHaveAttribute('data-sonner-theme', 'dark');

    await page.locator('[data-id="ranklist-share-action"]').hover();
    await page.locator('[data-id="ranklist-share-menu"]').getByRole('menuitem', { name: '复制本页链接' }).click();

    await expect(toaster).toHaveAttribute('data-sonner-theme', 'dark');
    const successToast = page.locator('[data-sonner-toast][data-type="success"]');
    await expect(successToast).toContainText('链接已复制');
    await expect(successToast.locator('svg.rankland-sonner-success-icon')).toHaveClass(/rankland-sonner-status-icon/);
    await expect(successToast).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(successToast).toHaveCSS('color', 'rgb(217, 217, 217)');
    await expect(successToast).toHaveCSS('border-color', 'rgb(66, 66, 66)');
    const sonnerVariables = await page.evaluate(() => {
      const toaster = document.querySelector('[data-sonner-toaster]');
      const toast = document.querySelector('[data-sonner-toast][data-type="success"]');
      if (!toaster || !toast) {
        return null;
      }
      return {
        normalBg: getComputedStyle(toaster).getPropertyValue('--normal-bg').trim(),
        normalText: getComputedStyle(toaster).getPropertyValue('--normal-text').trim(),
        toastBackground: getComputedStyle(toast).backgroundColor,
      };
    });
    expect(sonnerVariables).toEqual({
      normalBg: 'hsl(0 0% 0%)',
      normalText: 'hsl(0 0% 85%)',
      toastBackground: 'rgb(0, 0, 0)',
    });

    await page.evaluate(() => {
      document.querySelector('[data-sonner-toaster]')?.setAttribute('data-sonner-theme', 'light');
    });
    await expect(successToast).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(successToast).toHaveCSS('color', 'rgb(217, 217, 217)');
  });

  test('uses Switch and ToggleGroup controls in the ranklist preferences modal', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    const settingsButton = page.locator('[data-id="ranklist-settings-action"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.hover();
    const settingsTooltip = page.locator('[data-id="ranklist-settings-tooltip"]');
    await expect(settingsTooltip).toBeVisible();
    await expect(settingsTooltip).toHaveText('榜单偏好设置');
    const tooltipPlacement = await page.evaluate(() => {
      const trigger = document.querySelector('[data-id="ranklist-settings-action"]')?.getBoundingClientRect();
      const tooltip = document.querySelector('[data-id="ranklist-settings-tooltip"]')?.getBoundingClientRect();
      if (!trigger || !tooltip) {
        return null;
      }
      return {
        gap: Math.round(trigger.left - tooltip.right),
        tooltipRight: Math.round(tooltip.right),
        triggerLeft: Math.round(trigger.left),
      };
    });
    expect(tooltipPlacement).not.toBeNull();
    expect(tooltipPlacement!.tooltipRight).toBeLessThanOrEqual(tooltipPlacement!.triggerLeft);
    expect(tooltipPlacement!.gap).toBeGreaterThanOrEqual(6);

    await settingsButton.click();
    const settingsModal = page.locator('.srk-ranklist-settings-modal');
    await expect(settingsModal).toBeVisible();
    await expect(settingsModal.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(settingsModal.locator('select')).toHaveCount(0);
    await expect(settingsModal.getByRole('switch', { name: 'Pro 模式' })).toBeVisible();
    await expect(settingsModal.getByRole('switch', { name: '表格斑马纹' })).toBeVisible();
    await expect(settingsModal.locator('[data-id="ranklist-setting-status-cell-preset"]')).toHaveAttribute('role', 'group');
    await expect(settingsModal.locator('[data-id="ranklist-setting-status-highlight"]')).toHaveAttribute('role', 'group');
    await expect(settingsModal.locator('[data-id="ranklist-setting-empty-placeholder"]')).toHaveAttribute('role', 'group');
    const presetLayout = await settingsModal.locator('[data-id="ranklist-setting-status-cell-preset"]').evaluate((group) => {
      const buttonTops = Array.from(group.querySelectorAll('button')).map((button) =>
        Math.round(button.getBoundingClientRect().top),
      );
      return {
        rows: new Set(buttonTops).size,
        scrollWidth: group.scrollWidth,
        clientWidth: group.clientWidth,
      };
    });
    expect(presetLayout.rows).toBe(1);
    expect(presetLayout.scrollWidth).toBeLessThanOrEqual(presetLayout.clientWidth);

    const proTip = settingsModal.locator('[data-id="ranklist-setting-tip-professionalMode"]');
    await proTip.hover();
    const proTipPopover = page.locator('[data-id="ranklist-setting-tip-popover-professionalMode"]');
    await expect(proTipPopover).toBeVisible();
    await expect(proTipPopover).toContainText(
      '显示统计底栏和额外 Dirt/SE 列',
    );
    await expectPopoverPaintedOnTop(page, 'ranklist-setting-tip-popover-professionalMode');

    await settingsModal.getByRole('button', { name: '详细' }).click();
    await expect(settingsModal.getByRole('button', { name: '详细' })).toHaveAttribute('data-state', 'on');
  });

  test('shows ranklist settings info popovers on mobile tap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await page.locator('[data-id="ranklist-mobile-settings-action"]').click();
    const settingsModal = page.locator('.srk-ranklist-settings-modal');
    await expect(settingsModal).toBeVisible();
    await settingsModal.locator('[data-id="ranklist-setting-tip-professionalMode"]').click();
    const proTipPopover = page.locator('[data-id="ranklist-setting-tip-popover-professionalMode"]');
    await expect(proTipPopover).toBeVisible();
    await expect(proTipPopover).toContainText(
      '显示统计底栏和额外 Dirt/SE 列',
    );
    await expectPopoverPaintedOnTop(page, 'ranklist-setting-tip-popover-professionalMode');

    await settingsModal.getByRole('switch', { name: '分离 Organization 列' }).click();
    await settingsModal.locator('[data-id="ranklist-setting-tip-splitOrganization"]').click();
    const splitTipPopover = page.locator('[data-id="ranklist-setting-tip-popover-splitOrganization"]');
    await expect(splitTipPopover).toBeVisible();
    await expect(splitTipPopover).toContainText(
      '将参赛者 Organization 信息单独作为一列显示',
    );
    await expectPopoverPaintedOnTop(page, 'ranklist-setting-tip-popover-splitOrganization');
    const splitTipBounds = await splitTipPopover.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        viewportWidth: window.innerWidth,
      };
    });
    expect(splitTipBounds.left).toBeGreaterThanOrEqual(8);
    expect(splitTipBounds.right).toBeLessThanOrEqual(splitTipBounds.viewportWidth - 8);
  });

  test('shows only one settings action when mobile CSS and width state disagree', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        get: () => 1024,
      });
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="ranklist-mobile-settings-action"]')).toBeVisible();

    const visibleSettingsActionCount = await page.evaluate(() => {
      const isVisible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return Array.from(document.querySelectorAll('[data-id="ranklist-mobile-settings-action"], [data-id="ranklist-settings-action"]'))
        .filter(isVisible).length;
    });

    expect(visibleSettingsActionCount).toBe(1);
  });

  test('keeps ranklist dropdown menus open after mobile taps', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });

    const menuPairs = [
      ['ranklist-download-action', 'ranklist-download-menu'],
      ['ranklist-share-action', 'ranklist-share-menu'],
      ['ranklist-ref-links-more', 'ranklist-ref-links-menu'],
    ] as const;

    for (const [triggerId, menuId] of menuPairs) {
      await page.locator(`[data-id="${triggerId}"]`).click();
      const menu = page.locator(`[data-id="${menuId}"]`);
      await expect(menu).toBeVisible();
      await page.waitForTimeout(160);
      await expect(menu).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
    }
  });

  test('uses a 20px gap between organization filter and official-only toggle', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });

    const gap = await page.evaluate(() => {
      const select = document.querySelector('[data-id="ranklist-org-multi-select"]')?.getBoundingClientRect();
      const official = document.querySelector('.srk-ranklist-official-filter')?.getBoundingClientRect();
      if (!select || !official) {
        return null;
      }
      return Math.round(official.left - select.right);
    });

    expect(gap).toBe(20);
  });

  test('keeps the restored ranklist toolbar inside a narrow mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 260, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    const toolbarLayout = await page.evaluate(() => {
      const select = document.querySelector('[data-id="ranklist-org-multi-select"]')?.getBoundingClientRect();
      const official = document.querySelector('.srk-ranklist-official-filter')?.getBoundingClientRect();
      if (!select || !official) {
        return null;
      }
      return {
        selectWidth: Math.round(select.width),
        gap: Math.round(official.left - select.right),
      };
    });
    expect(toolbarLayout).not.toBeNull();
    expect(toolbarLayout!.selectWidth).toBeLessThanOrEqual(150);
    expect(toolbarLayout!.gap).toBeGreaterThanOrEqual(4);

    await page.locator('[data-id="ranklist-org-multi-select"]').click();
    await page.locator('[data-id="ranklist-org-search"]').fill('Beta');
    await page.locator('[data-id="ranklist-org-option-Beta University"]').click();
    await page.locator('[data-id="ranklist-org-search"]').fill('');
    await page.locator('[data-id="ranklist-org-option-Alpha University"]').click();
    await expect(page.locator('[data-id="ranklist-org-selected-count"]')).toHaveText('已选择 2 个');

    const metrics = await page.evaluate(() => {
      const pick = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) {
          return null;
        }
        const rect = element.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      };

      return {
        innerWidth: window.innerWidth,
        scrollX: window.scrollX,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        toolbar: pick('.srk-ranklist-toolbar'),
        filterPrimary: pick('.srk-ranklist-filter-primary'),
        dropdown: pick('.srk-multi-select-dropdown'),
        table: pick('.srk-main table'),
      };
    });

    expect(metrics.scrollX).toBe(0);
    expect(metrics.toolbar).not.toBeNull();
    expect(metrics.filterPrimary).not.toBeNull();
    expect(metrics.dropdown).not.toBeNull();
    expect(metrics.table).not.toBeNull();
    expect(metrics.toolbar!.right).toBeLessThanOrEqual(metrics.innerWidth);
    expect(metrics.filterPrimary!.right).toBeLessThanOrEqual(metrics.innerWidth);
    expect(metrics.dropdown!.right).toBeLessThanOrEqual(metrics.innerWidth);
    expect(metrics.table!.right).toBeGreaterThan(metrics.innerWidth);
    expect(metrics.documentWidth).toBeGreaterThanOrEqual(metrics.table!.right);
    expect(metrics.bodyWidth).toBeGreaterThanOrEqual(metrics.table!.right);
  });

  test('uses edge-to-edge ranklist content below desktop widths while preserving desktop gutters', async ({ page }) => {
    const readLayout = () => page.evaluate(() => {
      const pick = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) {
          return null;
        }
        const rect = element.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      };

      return {
        innerWidth: window.innerWidth,
        ranklistContent: pick('[data-id="ranklist-content"]'),
        tableFrame: pick('.srk-ranklist-table-scroll'),
      };
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ranklist/test-key');
    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });

    const mobileLayout = await readLayout();
    expect(mobileLayout.innerWidth).toBe(390);
    expect(mobileLayout.ranklistContent).toMatchObject({ left: 0, right: 390, width: 390 });
    expect(mobileLayout.tableFrame?.left).toBe(0);

    await page.setViewportSize({ width: 900, height: 844 });
    const tabletLayout = await readLayout();
    expect(tabletLayout.innerWidth).toBe(900);
    expect(tabletLayout.ranklistContent).toMatchObject({ left: 0, right: 900, width: 900 });
    expect(tabletLayout.tableFrame?.left).toBe(0);

    await page.setViewportSize({ width: 1280, height: 900 });
    const desktopLayout = await readLayout();
    expect(desktopLayout.innerWidth).toBe(1280);
    expect(desktopLayout.ranklistContent).toMatchObject({ left: 50, right: 1230, width: 1180 });
    expect(desktopLayout.tableFrame?.left).toBe(66);
  });

  test('shows Ranklist Not Found when API returns code=11', async ({ page }) => {
    await page.goto('/ranklist/missing-key');

    await expect(page.locator('[data-id="ranklist-not-found"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="ranklist-not-found-home-link"][href="/"]')).toBeVisible();
  });

  test('renders focus mode without the site chrome', async ({ page }) => {
    await page.goto('/ranklist/test-key?focus=yes');

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('header')).toHaveCount(0);
  });

  test('opens the user modal promptly and renders the rank trend chart', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/test-key');

    await page.getByText('Team Alpha').click();

    await expect(page.locator('[data-srk-modal-panel="true"]')).toBeVisible({ timeout: 1_000 });
    await expect(page.locator('.rank-curve')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.rank-curve')).toHaveCSS('background-color', 'rgb(16, 16, 16)');
    await expect(page.locator('.rank-curve canvas')).toBeVisible();
  });

  test('opens the user modal promptly when rank-time data is large', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('StyledRanklistSettingsIntroRead', 'true');
    });
    await page.goto('/ranklist/large-key');

    await expect(page.locator('[data-id="ranklist-content"][data-row-count="384"]')).toBeVisible({ timeout: 20_000 });

    const startedAt = Date.now();
    await page.getByText('Large Team 001').click({ force: true });

    await expect(page.locator('[data-srk-modal-panel="true"]')).toBeVisible({ timeout: 1_000 });
    expect(Date.now() - startedAt).toBeLessThan(1_500);
    await expect(page.locator('.rank-curve canvas')).toBeVisible({ timeout: 20_000 });
  });
});
