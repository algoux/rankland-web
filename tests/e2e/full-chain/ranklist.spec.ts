import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFile } from 'fs/promises';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function stubClipboard(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText = text;
        },
      },
    });
  });
}

async function forceSystemDarkMode(page: Page) {
  await page.addInitScript(() => {
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: query === '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })) as typeof window.matchMedia;
  });
}

async function forceSystemLightMode(page: Page) {
  await page.addInitScript(() => {
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: false,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    })) as typeof window.matchMedia;
  });
}

async function expectElementWithinViewport(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
}

async function expectNoHorizontalDocumentOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.documentScrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

async function expectHoverDropdownOpensAndCloses(page: Page, triggerTestId: string, itemTestId: string) {
  const trigger = page.locator(`[data-id="${triggerTestId}"]`);
  const item = page.locator(`[data-id="${itemTestId}"]`);

  await expect(item).toBeHidden();
  await trigger.hover();
  await expect(item).toBeVisible();
  await page.mouse.move(10, 10);
  await expect(item).toBeHidden();
}

async function expectNotificationMessage(page: Page, message: string) {
  await expect(page.locator('.ant-notification-notice-message', { hasText: message })).toBeVisible();
}

async function getHeaderActionTriggerStyle(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      paddingLeft: style.paddingLeft,
      borderLeftWidth: style.borderLeftWidth,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderRadius: style.borderRadius,
    };
  });
}

async function getHeaderMetaBlockSpacing(page: Page) {
  return page.evaluate(() => {
    const meta = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-header-meta"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const refLinks = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    if (!meta || !contributors || !refLinks) {
      throw new Error('Missing ranklist header meta block');
    }
    const metaStyle = window.getComputedStyle(meta);
    const contributorsStyle = window.getComputedStyle(contributors);
    const refLinksStyle = window.getComputedStyle(refLinks);
    return {
      metaMarginBottom: metaStyle.marginBottom,
      contributorsMarginTop: contributorsStyle.marginTop,
      contributorsMarginBottom: contributorsStyle.marginBottom,
      refLinksMarginTop: refLinksStyle.marginTop,
      metaToContributorsGap: Math.round(
        contributors.getBoundingClientRect().top - meta.getBoundingClientRect().bottom,
      ),
    };
  });
}

async function getRanklistHeaderTitlePresentation(page: Page) {
  return page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-title"]');
    if (!title) {
      throw new Error('Missing ranklist header title');
    }
    const style = window.getComputedStyle(title);
    return {
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      marginBottom: style.marginBottom,
    };
  });
}

async function getRanklistHeaderTextSizes(page: Page) {
  return page.evaluate(() => {
    const viewCount = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-view-count"]');
    const contributors = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-contributors"]');
    const refLinks = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    if (!viewCount || !contributors || !refLinks || !time) {
      throw new Error('Missing ranklist header text-size target');
    }
    return {
      viewCountFontSize: window.getComputedStyle(viewCount).fontSize,
      contributorsFontSize: window.getComputedStyle(contributors).fontSize,
      refLinksFontSize: window.getComputedStyle(refLinks).fontSize,
      timeFontSize: window.getComputedStyle(time).fontSize,
    };
  });
}

async function getRanklistLinkColors(page: Page) {
  return page.evaluate(() => {
    const viewCount = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-view-count"]');
    const refLink = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"] a');
    const refLinkLine = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-ref-links"]');
    const extraRefLinkTrigger = document.querySelector<HTMLElement>(
      '[data-id="rankland-ranklist-ref-link-extra-action"]',
    );
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    const footerContactTrigger = document.querySelector<HTMLElement>(
      '[data-id="rankland-ranklist-footer"] [data-id="contact-us-trigger"]',
    );
    if (!viewCount || !refLink || !refLinkLine || !extraRefLinkTrigger || !time || !footerContactTrigger) {
      throw new Error('Missing ranklist link color target');
    }
    return {
      viewCountColor: window.getComputedStyle(viewCount).color,
      refLinkColor: window.getComputedStyle(refLink).color,
      refLinkLineColor: window.getComputedStyle(refLinkLine).color,
      extraRefLinkTriggerColor: window.getComputedStyle(extraRefLinkTrigger).color,
      timeColor: window.getComputedStyle(time).color,
      footerContactTriggerColor: window.getComputedStyle(footerContactTrigger).color,
    };
  });
}

async function getUserModalBodyColor(page: Page) {
  return page.evaluate(() => {
    const modalBody = document.querySelector<HTMLElement>(
      '[data-id="rankland-ranklist-user-modal"] .rankland-user-modal-body',
    );
    if (!modalBody) {
      throw new Error('Missing rankland user modal body');
    }
    return window.getComputedStyle(modalBody).color;
  });
}

async function getTableWrapperMarginLeft(page: Page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!wrapper) {
      throw new Error('Missing rankland-ranklist-table-wrapper');
    }
    return window.getComputedStyle(wrapper).marginLeft;
  });
}

async function getControlsToTableGap(page: Page) {
  return page.evaluate(() => {
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    const tableWrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!controls || !tableWrapper) {
      throw new Error('Missing ranklist controls or table wrapper');
    }
    return Math.round(tableWrapper.getBoundingClientRect().top - controls.getBoundingClientRect().bottom);
  });
}

async function getProgressToControlsGap(page: Page) {
  return page.evaluate(() => {
    const progress = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-progress"]');
    const controls = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-controls"]');
    if (!progress || !controls) {
      throw new Error('Missing ranklist progress or controls');
    }
    return Math.round(controls.getBoundingClientRect().top - progress.getBoundingClientRect().bottom);
  });
}

async function getTimeToProgressGap(page: Page) {
  return page.evaluate(() => {
    const time = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-time"]');
    const progress = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-progress"]');
    if (!time || !progress) {
      throw new Error('Missing ranklist time or progress');
    }
    return Math.round(progress.getBoundingClientRect().top - time.getBoundingClientRect().bottom);
  });
}

async function getFooterParagraphSpacing(page: Page) {
  return page.evaluate(() => {
    const paragraphs = Array.from(
      document.querySelectorAll<HTMLElement>('[data-id="rankland-ranklist-footer"] p'),
    );
    if (paragraphs.length < 2) {
      throw new Error('Missing ranklist footer paragraphs');
    }
    return paragraphs.slice(0, 2).map((paragraph) => {
      const style = window.getComputedStyle(paragraph);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
  });
}

async function getFilterControlSpacing(page: Page) {
  return page.evaluate(() => {
    const filters = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-filters"]');
    const organizationFilterLabel = document
      .querySelector<HTMLElement>('[data-id="rankland-ranklist-organization-filter"]')
      ?.closest<HTMLElement>('.rankland-ranklist-filter');
    const checkbox = document.querySelector<HTMLElement>('.rankland-ranklist-checkbox');
    const markerFilter = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-marker-filter"]');
    if (!filters || !organizationFilterLabel || !checkbox || !markerFilter) {
      throw new Error('Missing ranklist filter controls');
    }
    const filtersStyle = window.getComputedStyle(filters);
    const organizationFilterLabelStyle = window.getComputedStyle(organizationFilterLabel);
    const checkboxStyle = window.getComputedStyle(checkbox);
    const markerFilterStyle = window.getComputedStyle(markerFilter);
    return {
      filtersColumnGap: filtersStyle.columnGap,
      organizationFilterColumnGap: organizationFilterLabelStyle.columnGap,
      checkboxMarginLeft: checkboxStyle.marginLeft,
      checkboxColumnGap: checkboxStyle.columnGap,
      markerMarginLeft: markerFilterStyle.marginLeft,
    };
  });
}

async function getRouteContentSpacing(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Missing route content element: ${selector}`);
    }
    const style = window.getComputedStyle(element);
    return {
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
      paddingBottom: style.paddingBottom,
    };
  }, selector);
}

async function hasLoadedZcoolXiaoWeiFont(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return Array.from(document.fonts).some(
      (fontFace) => fontFace.family === 'ZCOOL XiaoWei' && fontFace.status === 'loaded',
    );
  });
}

async function selectRanklistOrganization(page: Page, organization: string, expectedSelectedCount: number) {
  const filter = page.locator('[data-id="rankland-ranklist-organization-filter"]');
  const visibleDropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  const option = visibleDropdown.locator('.ant-select-item-option', { hasText: organization }).first();
  const selectedTag = filter.locator('.ant-select-selection-item');

  await filter.click();
  try {
    await visibleDropdown.waitFor({ state: 'visible', timeout: 1000 });
    await option.waitFor({ state: 'visible', timeout: 1000 });
  } catch (error) {
    await filter.click({ force: true });
    await page.keyboard.press('ArrowDown');
    await visibleDropdown.waitFor({ state: 'visible', timeout: 5000 });
    await option.waitFor({ state: 'visible', timeout: 5000 });
  }
  await option.click();
  await page.keyboard.press('Escape');
  await expect(selectedTag).toHaveText(`已选择 ${expectedSelectedCount} 个`);
}

async function reloadRanklistAndWaitForHydration(page: Page) {
  await page.reload();
  await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
  await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
}

test.describe('/ranklist/:id full-chain route', () => {
  test('renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await forceSystemLightMode(page);
    await stubClipboard(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Test Contest 2024');
    await expect(page).toHaveTitle('Test Contest 2024 | RankLand');
    await expect(
      page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]'),
    ).toBeVisible();
    expect(await getRouteContentSpacing(page, '[data-id="ranklist-content"]')).toMatchObject({
      marginTop: '32px',
      marginBottom: '32px',
    });
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeVisible();
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    expect(await getRanklistHeaderTitlePresentation(page)).toMatchObject({
      fontSize: '32px',
      fontWeight: '500',
      marginBottom: '4px',
    });
    expect(await getRanklistHeaderTextSizes(page)).toMatchObject({
      viewCountFontSize: '14px',
      contributorsFontSize: '14px',
      refLinksFontSize: '14px',
      timeFontSize: '14px',
    });
    await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('42');
    await expect(page.locator('[data-id="rankland-ranklist-view-count"] .anticon-eye')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-contributors"]')).toContainText(
      '贡献者：https://github.com/rankland-alpha, Team Beta',
    );
    expect(await getHeaderMetaBlockSpacing(page)).toMatchObject({
      metaMarginBottom: '0px',
      contributorsMarginTop: '0px',
      contributorsMarginBottom: '0px',
      refLinksMarginTop: '0px',
      metaToContributorsGap: 0,
    });
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"]')).toContainText(
      '相关链接：Official Site, Mirror, Statements',
    );
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).toHaveText('and 1 more');
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"] .anticon-caret-down')).toBeVisible();
    await expect.poll(() => getRanklistLinkColors(page)).toMatchObject({
      viewCountColor: 'rgba(0, 0, 0, 0.85)',
      refLinkColor: 'rgb(255, 129, 4)',
      extraRefLinkTriggerColor: 'rgba(0, 0, 0, 0.85)',
      refLinkLineColor: 'rgba(0, 0, 0, 0.85)',
      timeColor: 'rgba(0, 0, 0, 0.85)',
      footerContactTriggerColor: 'rgb(255, 129, 4)',
    });
    expect((await getRanklistLinkColors(page)).extraRefLinkTriggerColor).not.toBe(
      (await getRanklistLinkColors(page)).refLinkColor,
    );
    await page.locator('[data-id="rankland-ranklist-ref-links"] a').first().hover();
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"] a').first()).toHaveCSS(
      'color',
      'rgb(255, 157, 46)',
    );
    await expect(page.locator('[data-id="rankland-ranklist-banner"]')).toHaveAttribute(
      'src',
      `${mockBaseURL}/srk-assets/test-key/banner.png`,
    );
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    expect(await getTableWrapperMarginLeft(page)).toBe('16px');
    expect(await getTimeToProgressGap(page)).toBe(5);
    expect(await getProgressToControlsGap(page)).toBe(12);
    expect(await getControlsToTableGap(page)).toBe(24);
    const remarks = page.locator('[data-id="rankland-ranklist-table-wrapper"] .srk-remarks');
    await expect(remarks).toHaveText('备注：赛后补题榜单，仅供展示');
    await expect(remarks).toBeVisible();
    expect(await remarks.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        fontSize: style.fontSize,
        borderTopWidth: style.borderTopWidth,
        borderTopStyle: style.borderTopStyle,
        borderTopColor: style.borderTopColor,
        borderRadius: style.borderRadius,
        paddingLeft: style.paddingLeft,
        paddingTop: style.paddingTop,
        opacity: style.opacity,
      };
    })).toMatchObject({
      display: 'inline-block',
      fontSize: '12px',
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: 'rgba(255, 129, 4, 0.8)',
      borderRadius: '4px',
      paddingLeft: '8px',
      paddingTop: '4px',
      opacity: '0.75',
    });
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('Powered by Standard Ranklist');
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('需要专业的赛事外榜托管？');
    expect(await getFooterParagraphSpacing(page)).toEqual([
      { marginTop: '0px', marginBottom: '0px' },
      { marginTop: '4px', marginBottom: '0px' },
    ]);
    await expect(page.locator('[data-id="rankland-ranklist-beian"]')).toHaveCount(0);
    await page.locator('[data-id="rankland-ranklist-footer"] [data-id="contact-us-trigger"]').click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toBeVisible();
    await expect(page.locator('[data-id="contact-us-email"][href="mailto:algoux.org@gmail.com"]')).toHaveText(
      'algoux.org@gmail.com',
    );
    await expect(page.locator('[data-id="contact-us-qq-image"]')).toBeVisible();
    await page.locator('[data-id="contact-us-close"]').click();
    await expect(page.locator('[data-id="contact-us-dialog"]')).toHaveCount(0);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"] .anticon-download')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"] .anticon-share-alt')).toBeVisible();
    for (const selector of [
      '[data-id="rankland-ranklist-export-menu-button"]',
      '[data-id="rankland-ranklist-share-menu-button"]',
    ]) {
      expect(await getHeaderActionTriggerStyle(page, selector)).toMatchObject({
        paddingLeft: '8px',
        borderLeftWidth: '1px',
        borderTopWidth: '0px',
        borderRightWidth: '0px',
        borderBottomWidth: '0px',
        borderRadius: '0px',
      });
    }
    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-group"]')).toContainText('导出为');
    await page.mouse.move(10, 10);
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-group"]')).toBeHidden();
    await expectHoverDropdownOpensAndCloses(
      page,
      'rankland-ranklist-export-menu-button',
      'rankland-ranklist-export-srk-action',
    );
    await expectHoverDropdownOpensAndCloses(
      page,
      'rankland-ranklist-share-menu-button',
      'rankland-ranklist-copy-link-action',
    );
    await expectHoverDropdownOpensAndCloses(
      page,
      'rankland-ranklist-ref-link-extra-action',
      'rankland-ranklist-ref-link-extra-archive',
    );

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-srk-action"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('test-key.srk.json');
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    expect(JSON.parse(await readFile(downloadPath!, 'utf8')).contest.title).toBe('Test Contest 2024');

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const gymGhostDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]').click();
    const gymGhostDownload = await gymGhostDownloadPromise;
    expect(gymGhostDownload.suggestedFilename()).toBe('test-key_gymghost.dat');
    const gymGhostDownloadPath = await gymGhostDownload.path();
    expect(gymGhostDownloadPath).not.toBeNull();
    const gymGhostContent = await readFile(gymGhostDownloadPath!, 'utf8');
    expect(gymGhostContent).toContain('@contest "Test Contest 2024"');
    expect(gymGhostContent).toContain('Team Alpha');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Gym Ghost 已导出');

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const vjudgeDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-vjudge-action"]').click();
    const vjudgeDownload = await vjudgeDownloadPromise;
    expect(vjudgeDownload.suggestedFilename()).toBe('test-key_vjreplay.xlsx');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('VJudge Replay 已导出');

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    const excelDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-xlsx-action"]').click();
    const excelDownload = await excelDownloadPromise;
    expect(excelDownload.suggestedFilename()).toBe('test-key.xlsx');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Excel 已导出');

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').hover();
    await page.locator('[data-id="rankland-ranklist-copy-link-action"]').click();
    await expectNotificationMessage(page, '链接已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(`http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key`);

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').hover();
    await page.locator('[data-id="rankland-ranklist-copy-embed-action"]').click();
    await expectNotificationMessage(page, '嵌入代码已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(
      `<iframe src="http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`,
    );

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    await expect(userModal.locator('.srk-modal-title')).toHaveText('Team Alpha');
    await expect(userModal.locator('[data-id="rankland-user-modal-name"]')).toHaveCount(0);
    const organizationLine = userModal.locator('[data-id="rankland-user-modal-organization"]');
    await expect(organizationLine).toHaveText('Org A');
    const organizationLineStyle = await organizationLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(organizationLineStyle).toMatchObject({
      marginTop: '0px',
      marginBottom: '0px',
    });
    const teamMembers = userModal.locator('[data-id="rankland-user-modal-team-members"]');
    await expect(teamMembers.locator('[data-id="rankland-user-modal-team-member"]')).toContainText(['Alice', 'Bob']);
    await expect(teamMembers.locator('[data-id="rankland-user-modal-team-separator"]')).toHaveText('/');
    const teamMemberStyle = await teamMembers.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        opacity: style.opacity,
        paddingTop: style.paddingTop,
      };
    });
    expect(teamMemberStyle).toMatchObject({
      display: 'block',
      opacity: '0.8',
      paddingTop: '6px',
    });
    const separatorStyle = await teamMembers
      .locator('[data-id="rankland-user-modal-team-separator"]')
      .evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          opacity: style.opacity,
          fontSize: style.fontSize,
        };
      });
    expect(separatorStyle).toMatchObject({
      opacity: '0.5',
      fontSize: '12.8px',
    });
    const marker = userModal.locator('[data-id="rankland-user-modal-marker"]').first();
    await expect(marker).toHaveText('Gold Group');
    await expect(marker).toHaveClass(/user-modal-info-marker/);
    await expect(marker).toHaveClass(/srk-preset-marker-yellow/);
    const markerStyle = await marker.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        fontSize: style.fontSize,
        borderRadius: style.borderRadius,
        borderTopWidth: style.borderTopWidth,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        marginRight: style.marginRight,
      };
    });
    expect(markerStyle).toMatchObject({
      display: 'inline-block',
      fontSize: '12px',
      borderRadius: '4px',
      borderTopWidth: '1px',
      paddingTop: '2px',
      paddingRight: '2px',
      paddingBottom: '2px',
      paddingLeft: '2px',
      marginRight: '0px',
    });
    const photo = userModal.locator('[data-id="rankland-user-modal-photo"]');
    await expect(photo).toHaveAttribute('alt', '选手照片');
    const photoStyle = await photo.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        width: style.width,
        maxWidth: style.maxWidth,
      };
    });
    const photoModalBodyWidth = await photo.evaluate((element) => {
      const modalBody = element.closest('.rankland-user-modal-body');
      return modalBody ? window.getComputedStyle(modalBody).width : '';
    });
    expect(photoStyle).toMatchObject({
      width: photoModalBodyWidth,
      maxWidth: '100%',
    });
    const segmentLine = userModal.locator('[data-id="rankland-user-modal-segment"]');
    await expect(segmentLine).toContainText('所在奖区（Rank）：');
    const segmentLineStyle = await segmentLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(segmentLineStyle).toMatchObject({
      marginTop: '16px',
      marginBottom: '0px',
    });
    await expect(userModal.locator('[data-id="rankland-user-modal-segment-label"]')).toHaveText('Gold');
    await expect(userModal.locator('[data-id="rankland-user-modal-segment-label"]')).toHaveClass(/bg-segment-gold/);
    const slogan = userModal.locator('[data-id="rankland-user-modal-slogan"]');
    await expect(slogan).toHaveText('Keep moving forward');
    const sloganStyle = await slogan.evaluate((element) => {
      const style = window.getComputedStyle(element);
      const beforeStyle = window.getComputedStyle(element, '::before');
      return {
        textAlign: style.textAlign,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        beforeContent: beforeStyle.content,
        beforeDisplay: beforeStyle.display,
        beforeFontSize: beforeStyle.fontSize,
      };
    });
    expect(sloganStyle).toMatchObject({
      textAlign: 'center',
      fontSize: '32px',
      beforeContent: '"SLOGAN"',
      beforeDisplay: 'block',
      beforeFontSize: '14px',
    });
    expect(sloganStyle.fontFamily).toContain('ZCOOL XiaoWei');
    expect(await hasLoadedZcoolXiaoWeiFont(page)).toBe(true);
    await userModal.getByRole('button', { name: 'Close' }).click();
    await expect(userModal.locator('.srk-modal')).toBeHidden();

    await page.locator('.srk-user-cell', { hasText: 'Team Beta' }).click();
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    const unofficialLine = userModal.locator('[data-id="rankland-user-modal-unofficial"]');
    await expect(unofficialLine).toHaveText('＊ 非正式参加者');
    const unofficialLineStyle = await unofficialLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });
    expect(unofficialLineStyle).toMatchObject({
      marginTop: '16px',
      marginBottom: '0px',
    });
    await userModal.getByRole('button', { name: 'Close' }).click();
    await expect(userModal.locator('.srk-modal')).toBeHidden();

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string; search: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');
    const srkFileRequests = requests.filter(
      (requestRecord) =>
        requestRecord.path === '/file/download' &&
        new URLSearchParams(requestRecord.search).get('id') === 'file-test-1',
    );

    expect(rankRequests).toHaveLength(1);
    expect(srkFileRequests).toHaveLength(1);
  });

  test('uses the legacy responsive width for the user info modal on mobile', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await page.setViewportSize({ width: 390, height: 844 });

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
    const teamAlphaRow = page.locator('tr', { hasText: 'Team Alpha' });
    await expect(teamAlphaRow).toBeVisible();

    await teamAlphaRow.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click({ force: true });
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"] [data-srk-modal-panel="true"]');
    await expect(userModal).toBeVisible();

    const modalLayout = await userModal.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        style: element.getAttribute('style') || '',
        width: Math.round(box.width),
        viewportWidth: window.innerWidth,
      };
    });

    expect(modalLayout.width).toBeLessThanOrEqual(modalLayout.viewportWidth);
    expect(modalLayout.style).toContain(`width: ${modalLayout.viewportWidth - 20}px`);
  });

  test('renders the Not Found page when the backend returns missing ranklist', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/missing-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found | RankLand');
    await expect(page.locator('[data-id="ranklist-not-found"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-not-found"] h3')).toHaveText('Ranklist Not Found');
    await expect(page.locator('[data-id="ranklist-not-found-home-link"][href="/"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-primary/);
    await expect(page.locator('[data-id="ranklist-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-sm/);

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/missing-key');

    expect(rankRequests).toHaveLength(1);
  });

  test('renders the legacy ranklist load error state with Ant Design refresh action', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await request.post(`${mockBaseURL}/__fail-ranklist/test-key`);

    const response = await page.goto('/ranklist/test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('RankLand');
    await expect(page.locator('[data-id="ranklist-error"]')).toBeVisible();
    await expect(page.locator('[data-id="ranklist-error"] p')).toHaveText('An error occurred while loading data');
    await expect(page.locator('[data-id="ranklist-error"]')).toHaveCSS('margin-top', '64px');
    await expect(page.locator('[data-id="ranklist-error"]')).toHaveCSS('text-align', 'center');
    await expect(page.locator('[data-id="ranklist-refresh"]')).toHaveText('Refresh');
    await expect(page.locator('[data-id="ranklist-refresh"]')).toHaveClass(/ant-btn-primary/);
    await expect(page.locator('[data-id="ranklist-refresh"]')).toHaveClass(/ant-btn-sm/);

    const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
    const requests = (await requestsResponse.json()) as Array<{ path: string }>;
    const rankRequests = requests.filter((requestRecord) => requestRecord.path === '/rank/test-key');
    const srkFileRequests = requests.filter((requestRecord) => requestRecord.path === '/file/download');

    expect(rankRequests).toHaveLength(1);
    expect(srkFileRequests).toHaveLength(0);
  });

  test('renders legacy Ant Design filter controls and preserves filtering behavior', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await page.setViewportSize({ width: 1280, height: 800 });

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-organization-filter"]')).toHaveClass(/ant-select/);
    await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toHaveClass(/ant-switch/);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"]')).toHaveClass(/ant-radio-group/);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper')).toContainText([
      '全部',
      'Gold Group',
      'Silver Group',
    ]);
    expect(await getFilterControlSpacing(page)).toMatchObject({
      filtersColumnGap: '0px',
      organizationFilterColumnGap: '8px',
      checkboxMarginLeft: '20px',
      checkboxColumnGap: '4px',
      markerMarginLeft: '20px',
    });

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeVisible();

    await selectRanklistOrganization(page, 'Org A', 1);
    await selectRanklistOrganization(page, 'Org B', 2);

    const organizationFilter = page.locator('[data-id="rankland-ranklist-organization-filter"]');
    await expect(organizationFilter.locator('.ant-select-selection-item')).toHaveText('已选择 2 个');

    await reloadRanklistAndWaitForHydration(page);

    await selectRanklistOrganization(page, 'Org A', 1);

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toHaveCount(0);

    await reloadRanklistAndWaitForHydration(page);
    await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toBeVisible();
    await page.locator('[data-id="rankland-ranklist-official-filter"]').click();

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toHaveCount(0);

    await reloadRanklistAndWaitForHydration(page);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"]')).toBeVisible();
    await page.locator('[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper', { hasText: 'Gold Group' }).click();

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toHaveCount(0);
  });

  test('passes the RankLand dark theme into the low-level SRK table renderer', async ({ page, request }) => {
    await denyExternalCalls(page);
    await forceSystemDarkMode(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveClass('dark');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expect.poll(() => getRanklistLinkColors(page)).toMatchObject({
      refLinkColor: 'rgb(246, 172, 6)',
      extraRefLinkTriggerColor: 'rgba(255, 255, 255, 0.85)',
      refLinkLineColor: 'rgba(255, 255, 255, 0.85)',
      footerContactTriggerColor: 'rgb(246, 172, 6)',
    });
    await page.locator('[data-id="rankland-ranklist-ref-links"] a').first().hover();
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"] a').first()).toHaveCSS(
      'color',
      'rgb(167, 119, 11)',
    );
    await expect(
      page.locator('[data-id="rankland-ranklist-table-wrapper"] .srk-remarks'),
    ).toHaveCSS('border-top-color', 'rgba(246, 172, 6, 0.8)');

    await expect.poll(async () => {
      return page.locator('.srk-problem-header').first().evaluate((element) => {
        return window.getComputedStyle(element).backgroundImage;
      });
    }).toContain('rgb(15, 23, 42)');

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    await expect.poll(() => getUserModalBodyColor(page)).toBe('rgba(255, 255, 255, 0.85)');
  });

  test('keeps the ranklist page wrappers within desktop and mobile viewport bounds', async ({
    page,
    request,
  }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/ranklist/test-key?focus=yes');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-controls"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-header-actions"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-controls"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-footer"]'), page);
    await page.screenshot({ path: testInfo.outputPath('ranklist-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/ranklist/test-key?focus=yes');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-header-actions"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-controls"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-footer"]'), page);
    await page.screenshot({ path: testInfo.outputPath('ranklist-mobile.png'), fullPage: true });
  });
});
