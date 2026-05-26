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

async function getTableWrapperMarginLeft(page: Page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector<HTMLElement>('[data-id="rankland-ranklist-table-wrapper"]');
    if (!wrapper) {
      throw new Error('Missing rankland-ranklist-table-wrapper');
    }
    return window.getComputedStyle(wrapper).marginLeft;
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

async function selectRanklistOrganization(page: Page, organization: string) {
  await page.locator('[data-id="rankland-ranklist-organization-filter"] .ant-select-selector').click();
  await page.locator('.ant-select-dropdown .ant-select-item-option', { hasText: organization }).click();
  await page.keyboard.press('Escape');
}

test.describe('/ranklist/:id full-chain route', () => {
  test('renders the ranklist detail page through SSR, hydration, RanklandApiService, and the mock backend', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await stubClipboard(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Test Contest 2024');
    await expect(page).toHaveTitle('Test Contest 2024 - RankLand');
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
    await expect(page.locator('[data-id="rankland-ranklist-view-count"]')).toHaveText('浏览 42');
    await expect(page.locator('[data-id="rankland-ranklist-contributors"]')).toContainText(
      '贡献者：https://github.com/rankland-alpha, Team Beta',
    );
    await expect(page.locator('[data-id="rankland-ranklist-ref-links"]')).toContainText(
      '相关链接：Official Site, Mirror, Statements',
    );
    await expect(page.locator('[data-id="rankland-ranklist-ref-link-extra-action"]')).toHaveText('and 1 more');
    await expect(page.locator('[data-id="rankland-ranklist-banner"]')).toHaveAttribute(
      'src',
      `${mockBaseURL}/srk-assets/test-key/banner.png`,
    );
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    expect(await getTableWrapperMarginLeft(page)).toBe('16px');
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
      borderRadius: '4px',
      paddingLeft: '8px',
      paddingTop: '4px',
      opacity: '0.75',
    });
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('Powered by Standard Ranklist');
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('需要专业的赛事外榜托管？');
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
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('链接已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(`http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key`);

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').hover();
    await page.locator('[data-id="rankland-ranklist-copy-embed-action"]').click();
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('嵌入代码已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(
      `<iframe src="http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/ranklist/test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`,
    );

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
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
    await expect(userModal.locator('[data-id="rankland-user-modal-segment"]')).toContainText('所在奖区（Rank）：');
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

  test('renders the Not Found page when the backend returns missing ranklist', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/missing-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found - RankLand');
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

  test('renders legacy Ant Design filter controls and preserves filtering behavior', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/ranklist/test-key?focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-organization-filter"]')).toHaveClass(/ant-select/);
    await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toHaveClass(/ant-switch/);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"]')).toHaveClass(/ant-radio-group/);
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper')).toContainText([
      '全部',
      'Gold Group',
      'Silver Group',
    ]);

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeVisible();

    await selectRanklistOrganization(page, 'Org A');

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeHidden();

    await page.reload();
    await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toBeVisible();
    await page.locator('[data-id="rankland-ranklist-official-filter"]').click();

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeHidden();

    await page.reload();
    await expect(page.locator('[data-id="rankland-ranklist-marker-filter"]')).toBeVisible();
    await page.locator('[data-id="rankland-ranklist-marker-filter"] .ant-radio-button-wrapper', { hasText: 'Gold Group' }).click();

    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeHidden();
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

    await expect.poll(async () => {
      return page.locator('.srk-problem-header').first().evaluate((element) => {
        return window.getComputedStyle(element).backgroundImage;
      });
    }).toContain('rgb(15, 23, 42)');
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
