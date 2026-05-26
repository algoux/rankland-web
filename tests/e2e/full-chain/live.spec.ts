import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { denyExternalCalls, stubWebSocket } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function readRequests(request: APIRequestContext) {
  const response = await request.get(`${mockBaseURL}/__requests`);
  return (await response.json()) as Array<{ path: string; search: string }>;
}

function bytes(text: string) {
  return Array.from(new TextEncoder().encode(text));
}

function makeRealtimeSolutionBytes() {
  const fields = [
    [0, 0, 0, 0, 0, 0, 0, 7],
    bytes('A'),
    bytes('team-alpha'),
    bytes('AC'),
    [2],
  ];
  const header = [fields.length, ...fields.map((field) => field.length)];
  return [...header, ...fields.flat()];
}

async function emitRealtimeSolution(page: Page, url: string) {
  await page.evaluate(
    ({ url, message }) => {
      (
        window as unknown as {
          __ranklandEmitWsMessage?: (url: string, bytes: number[]) => void;
        }
      ).__ranklandEmitWsMessage?.(url, message);
    },
    {
      url,
      message: makeRealtimeSolutionBytes(),
    },
  );
}

async function readRanklandWebSocketUrls(page: Page) {
  return page.evaluate(() =>
    ((window as unknown as { __ranklandWsUrls?: string[] }).__ranklandWsUrls || []).filter((url) =>
      url.includes('/ranking/record/'),
    ),
  );
}

async function stubClipboard(page: Page) {
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

async function expectNotificationMessage(page: Page, message: string) {
  await expect(page.locator('.ant-notification-notice-message', { hasText: message })).toBeVisible();
}

async function getHeaderActionTriggerStyle(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      paddingLeft: style.paddingLeft,
      borderLeftWidth: style.borderLeftWidth,
      borderRadius: style.borderRadius,
    };
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
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      textAlign: style.textAlign,
    };
  }, selector);
}

async function selectRanklistOrganization(page: Page, organization: string) {
  await page.locator('[data-id="rankland-ranklist-organization-filter"] .ant-select-selector').click();
  await page.locator('.ant-select-dropdown .ant-select-item-option', { hasText: organization }).click();
  await page.keyboard.press('Escape');
}

test.describe('/live/:id full-chain route', () => {
  test('hydrates the CSR live page, preserves queries, polls live ranklist, and guards WebSocket setup', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await stubClipboard(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/live/live-test-key?token=t0&scrollSolution=1&focus=yes');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Live: Test Contest 2024 | RankLand');
    await expect(
      page.locator(
        '[data-id="live-ranklist-content"][data-ranklist-id="live-test-key"][data-live-id="live-rid-1"][data-row-count="2"][data-focus="yes"]',
      ),
    ).toBeVisible();
    expect(await getRouteContentSpacing(page, '[data-id="live-ranklist-content"]')).toMatchObject({
      marginTop: '32px',
      marginBottom: '32px',
    });
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('width', '1px');
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('height', '1px');
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('[data-id="live-scroll-solution-toggle"]')).toHaveClass(/ant-switch/);
    await expect(page.locator('[data-id="live-scroll-solution-toggle"]')).toHaveClass(/ant-switch-small/);
    await expect(page.locator('[data-id="live-scroll-solution-toggle"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.live-scroll-toggle')).toHaveCSS('column-gap', '4px');
    await expect(page.locator('.live-scroll-toggle')).toHaveCSS('font-size', '14px');
    await expect(page.locator('.live-scroll-toggle')).toHaveCSS('color', 'rgba(0, 0, 0, 0.85)');
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toBeHidden();
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-extra-action"]')).toBeVisible();
    expect(await getTableWrapperMarginLeft(page)).toBe('16px');
    await expect(page.locator('[data-id="rankland-ranklist-footer"]')).toContainText('Powered by Standard Ranklist');
    await expect(page.locator('[data-id="rankland-ranklist-export-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-share-menu-button"]')).toBeVisible();
    expect(await getHeaderActionTriggerStyle(page, '[data-id="rankland-ranklist-export-menu-button"]')).toMatchObject({
      paddingLeft: '0px',
      borderLeftWidth: '0px',
      borderRadius: '0px',
    });
    expect(await getHeaderActionTriggerStyle(page, '[data-id="rankland-ranklist-share-menu-button"]')).toMatchObject({
      paddingLeft: '8px',
      borderLeftWidth: '1px',
      borderRadius: '0px',
    });
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeVisible();

    await page.locator('[data-id="rankland-ranklist-export-menu-button"]').hover();
    await expect(page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]')).toBeEnabled();
    await expect(page.locator('[data-id="rankland-ranklist-export-vjudge-action"]')).toBeEnabled();
    await expect(page.locator('[data-id="rankland-ranklist-export-xlsx-action"]')).toBeEnabled();

    const liveGymGhostDownloadPromise = page.waitForEvent('download');
    await page.locator('[data-id="rankland-ranklist-export-gym-ghost-action"]').click();
    const liveGymGhostDownload = await liveGymGhostDownloadPromise;
    expect(liveGymGhostDownload.suggestedFilename()).toBe('live-test-key_gymghost.dat');
    await expect(page.locator('[data-id="rankland-ranklist-action-status"]')).toHaveText('Gym Ghost 已导出');

    await page.locator('[data-id="rankland-ranklist-share-menu-button"]').hover();
    await page.locator('[data-id="rankland-ranklist-copy-embed-action"]').click();
    await expectNotificationMessage(page, '嵌入代码已复制');
    expect(
      await page.evaluate(() => (window as unknown as { __ranklandClipboardText?: string }).__ranklandClipboardText),
    ).toBe(
      `<iframe src="http://127.0.0.1:${process.env.FULL_CHAIN_APP_PORT || '3100'}/live/live-test-key?focus=yes" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`,
    );

    await selectRanklistOrganization(page, 'Org A');
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Beta' })).toBeHidden();

    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();
    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    await expect(userModal).toContainText('Team Alpha');
    await expect(userModal).toContainText('Org A');
    await expect(userModal.locator('[data-id="rankland-user-modal-photo"]')).toHaveAttribute(
      'src',
      `${mockBaseURL}/srk-assets/live-test-key/team-alpha.png`,
    );
    await expect(userModal.locator('[data-id="rankland-rank-time-panel"]')).toBeVisible();
    await expect(userModal.locator('[data-id="rankland-rank-time-unit"]')).toHaveCount(0);
    await expect(userModal.locator('[data-id="rankland-rank-time-summary"]')).toHaveCount(0);
    await expect(userModal.locator('[data-id="rankland-rank-time-event"]')).toHaveCount(0);
    expect(
      await userModal.locator('[data-id="rankland-rank-time-panel"]').evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          marginTop: style.marginTop,
          paddingTop: style.paddingTop,
          borderTopWidth: style.borderTopWidth,
        };
      }),
    ).toEqual({
      marginTop: '16px',
      paddingTop: '0px',
      borderTopWidth: '0px',
    });
    const rankTimeChart = userModal.locator('[data-id="rankland-rank-time-g2-chart"]');
    await expect(rankTimeChart).toBeVisible();
    await expect(rankTimeChart).toHaveAttribute('data-chart-library', '@antv/g2');
    await expect(rankTimeChart).toHaveAttribute('data-line-animation', 'pathIn:2000');
    await expect(rankTimeChart).toHaveAttribute('data-event-animation', 'zoomIn:200');
    await expect(rankTimeChart).toHaveAttribute('data-tooltip-items', '主排名,解题数');
    await expect(rankTimeChart).toHaveAttribute('data-event-tooltip', 'AC:A (0:40:00)');
    await expect(userModal.locator('[data-id="rankland-rank-time-curve"] canvas')).toBeVisible();
    expect(
      await userModal.locator('[data-id="rankland-rank-time-curve"]').evaluate((element) => getComputedStyle(element).height),
    ).toBe('400px');
    await userModal.getByRole('button', { name: 'Close' }).click();
    await expect(userModal.locator('.srk-modal')).toBeHidden();

    await page
      .locator('tr', { hasText: 'Team Alpha' })
      .locator('.srk-prest-status-block-accepted')
      .first()
      .click();
    const solutionModal = page.locator('[data-id="rankland-ranklist-solution-modal"]');
    await expect(solutionModal.locator('.srk-modal')).toBeVisible();
    await expect(solutionModal).toContainText('Solutions of A (Team Alpha)');
    await expect(solutionModal).toContainText('Accepted');
    await solutionModal.getByRole('button', { name: 'Close' }).click();
    await expect(solutionModal.locator('.srk-modal')).toBeHidden();

    await expect
      .poll(async () => readRanklandWebSocketUrls(page))
      .toContain(`ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`);

    await page.evaluate(
      ({ url, message }) => {
        (
          window as unknown as {
            __ranklandEmitWsMessage?: (url: string, bytes: number[]) => void;
          }
        ).__ranklandEmitWsMessage?.(url, message);
      },
      {
        url: `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`,
        message: makeRealtimeSolutionBytes(),
      },
    );

    const scrollSolutionItem = page.locator('[data-id="live-scroll-solution-item"]').first();
    await expect(scrollSolutionItem).toContainText('2');
    await expect(scrollSolutionItem).toContainText('Team Alpha');
    await expect(scrollSolutionItem).toContainText('A');
    await expect(scrollSolutionItem).toContainText('AC');

    await page.evaluate((url) => {
      (
        window as unknown as {
          __ranklandEmitWsError: (url: string) => void;
        }
      ).__ranklandEmitWsError(url);
    }, `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`);
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('reconnecting');
    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect.poll(async () => readRanklandWebSocketUrls(page)).toEqual([
      `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`,
      `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`,
    ]);
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');

    const requests = await readRequests(request);
    const liveInfoRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/config/live-test-key');
    const liveRanklistRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/live-rid-1');

    expect(liveInfoRequests).toHaveLength(1);
    expect(liveRanklistRequests.length).toBeGreaterThanOrEqual(1);
    expect(liveRanklistRequests[0].search).toContain('token=t0');
    expect(requests.some((requestRecord) => requestRecord.path === '/rank/live-test-key')).toBe(false);
    expect(requests.some((requestRecord) => requestRecord.path === '/file/download')).toBe(false);
  });

  test('keeps the realtime event panel within desktop and mobile viewport bounds', async ({ page, request }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&scrollSolution=1&focus=yes');

    const wsUrl = `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`;
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await emitRealtimeSolution(page, wsUrl);

    const scrollSolutionItems = page.locator('[data-id="live-scroll-solution-item"]');
    await expect(scrollSolutionItems).toHaveCount(1);
    await expect(scrollSolutionItems).toContainText('Team Alpha');
    await expect(scrollSolutionItems).toContainText('A');
    await expect(scrollSolutionItems).toContainText('AC');
    await page.waitForTimeout(800);

    const measureLayout = () =>
      page.evaluate(() => {
        function rect(selector: string) {
          const element = document.querySelector(selector);
          if (!(element instanceof HTMLElement)) {
            throw new Error(`Missing ${selector}`);
          }
          const box = element.getBoundingClientRect();
          return {
            bottom: box.bottom,
            height: box.height,
            left: box.left,
            right: box.right,
            top: box.top,
            width: box.width,
          };
        }

        return {
          content: rect('[data-id="live-ranklist-content"]'),
          item: rect('[data-id="live-scroll-solution-item"]'),
          panel: rect('[data-id="live-scroll-solution"]'),
          progressRight: rect('.srk-progress-secondary-area-right'),
          viewport: {
            height: window.innerHeight,
            width: window.innerWidth,
          },
        };
      });

    const desktop = await measureLayout();
    expect(Math.round(desktop.panel.width)).toBe(250);
    expect(Math.round(desktop.item.height)).toBe(45);
    expect(desktop.panel.left).toBeGreaterThanOrEqual(0);
    expect(desktop.panel.right).toBeLessThanOrEqual(desktop.viewport.width);
    expect(Math.abs(desktop.panel.bottom - desktop.viewport.height)).toBeLessThanOrEqual(1);
    expect(desktop.content.left).toBeGreaterThanOrEqual(250);
    const desktopScreenshot = testInfo.outputPath('live-realtime-desktop.png');
    await page.screenshot({ fullPage: false, path: desktopScreenshot });
    await testInfo.attach('live-realtime-desktop', {
      path: desktopScreenshot,
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(scrollSolutionItems).toBeVisible();

    const mobile = await measureLayout();
    expect(Math.round(mobile.item.height)).toBe(45);
    expect(mobile.panel.left).toBeGreaterThanOrEqual(0);
    expect(mobile.panel.right).toBeLessThanOrEqual(mobile.viewport.width);
    expect(mobile.panel.width).toBeLessThanOrEqual(mobile.viewport.width);
    expect(mobile.content.left).toBeLessThan(250);
    expect(mobile.progressRight.left).toBeGreaterThanOrEqual(0);
    expect(mobile.progressRight.right).toBeLessThanOrEqual(mobile.viewport.width);
    const mobileScreenshot = testInfo.outputPath('live-realtime-mobile.png');
    await page.screenshot({ fullPage: false, path: mobileScreenshot });
    await testInfo.attach('live-realtime-mobile', {
      path: mobileScreenshot,
      contentType: 'image/png',
    });
  });

  test('renders realtime events with the legacy Toastify container and Zoom presentation', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&scrollSolution=1&focus=yes');

    const wsUrl = `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`;
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await emitRealtimeSolution(page, wsUrl);

    const container = page.locator('[data-id="live-scroll-solution"]');
    const toast = page.locator('[data-id="live-scroll-solution-item"]').first();

    await expect(container).toHaveClass(/plugin_scroll-solution-container/);
    await expect(container).toHaveClass(/Toastify__toast-container/);
    await expect(container).toHaveClass(/Toastify__toast-container--bottom-left/);
    await expect(toast).toHaveClass(/Toastify__toast/);
    await expect(toast).toHaveClass(/Toastify__zoom-enter/);
    await expect(toast.locator('.container')).toContainText('Team Alpha');
    await expect(toast.locator('.score')).toHaveText('2');
    await expect(toast.locator('.problem')).toHaveText('A');
    await expect(toast.locator('.result.result-ac')).toHaveText('AC');
    await expect(container.locator('.Toastify__close-button')).toHaveCount(0);
    await expect(container.locator('.Toastify__progress-bar')).toHaveCount(0);

    const toastifyLayout = await page.evaluate(() => {
      const containerElement = document.querySelector('[data-id="live-scroll-solution"]');
      const toastElement = document.querySelector('[data-id="live-scroll-solution-item"]');
      if (!(containerElement instanceof HTMLElement) || !(toastElement instanceof HTMLElement)) {
        throw new Error('Missing live scroll-solution Toastify elements');
      }

      const containerBox = containerElement.getBoundingClientRect();
      const containerStyle = getComputedStyle(containerElement);
      const toastStyle = getComputedStyle(toastElement);

      return {
        container: {
          bottom: containerBox.bottom,
          left: containerBox.left,
          padding: containerStyle.padding,
          position: containerStyle.position,
          width: containerBox.width,
          zIndex: containerStyle.zIndex,
        },
        toast: {
          animationDuration: toastStyle.animationDuration,
          animationFillMode: toastStyle.animationFillMode,
          animationName: toastStyle.animationName,
          borderRadius: toastStyle.borderRadius,
          cssHeight: toastStyle.height,
          marginBottom: toastStyle.marginBottom,
          minHeight: toastStyle.minHeight,
          padding: toastStyle.padding,
        },
        viewportHeight: window.innerHeight,
      };
    });

    expect(toastifyLayout.container.position).toBe('fixed');
    expect(Math.round(toastifyLayout.container.width)).toBe(250);
    expect(Math.round(toastifyLayout.container.left)).toBe(0);
    expect(Math.abs(toastifyLayout.container.bottom - toastifyLayout.viewportHeight)).toBeLessThanOrEqual(1);
    expect(toastifyLayout.container.padding).toBe('0px');
    expect(toastifyLayout.container.zIndex).toBe('9999');
    expect(toastifyLayout.toast.cssHeight).toBe('45px');
    expect(toastifyLayout.toast.marginBottom).toBe('0px');
    expect(toastifyLayout.toast.borderRadius).toBe('0px');
    expect(toastifyLayout.toast.padding).toBe('0px');
    expect(toastifyLayout.toast.minHeight).toBe('0px');
    expect(toastifyLayout.toast.animationName).toBe('Toastify__zoomIn');
    expect(toastifyLayout.toast.animationDuration).toBe('0.75s');
    expect(toastifyLayout.toast.animationFillMode).toBe('forwards');
  });

  test('keeps the normal live page within desktop and mobile viewport bounds', async ({
    page,
    request,
  }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/live/live-test-key?token=t0');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toBeVisible();
    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText('Test Contest 2024');
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-header-actions"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-progress"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-footer"]'), page);
    await page.screenshot({ path: testInfo.outputPath('live-page-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/live/live-test-key?token=t0');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="app-shell"]')).toBeVisible();
    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveText('hydrated');
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-header-actions"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-progress"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="rankland-ranklist-footer"]'), page);
    await page.screenshot({ path: testInfo.outputPath('live-page-mobile.png'), fullPage: true });
  });

  test('hides the scroll-solution toggle on mobile while preserving live ranklist rendering', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&focus=yes');

    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('[data-id="live-hydrated"]')).toHaveText('hydrated');
    await expect(page.getByText('Team Alpha')).toBeVisible();
    await expect(page.locator('[data-id="live-scroll-solution-toggle"]')).toBeHidden();
    await expect(page.locator('[data-id="live-scroll-solution"]')).toBeHidden();
  });

  test('renders the legacy Ant Design loading spinner while live ranklist info is loading', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await request.post(`${mockBaseURL}/__delay-live-info/live-test-key?ms=1000`);

    const response = await page.goto('/live/live-test-key', { waitUntil: 'domcontentloaded' });

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page.locator('[data-id="live-loading"].ant-spin')).toBeVisible();
    expect(await getRouteContentSpacing(page, '[data-id="live-loading"]')).toMatchObject({
      marginTop: '64px',
      paddingTop: '0px',
      textAlign: 'center',
    });
    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
  });

  test('renders the Not Found page when the backend returns missing live contest info', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const response = await page.goto('/live/missing-live');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Not Found | RankLand');
    await expect(page.locator('[data-id="live-not-found"]')).toBeVisible();
    await expect(page.locator('[data-id="live-not-found"] h3')).toHaveText('Ranklist Not Found');
    await expect(page.locator('[data-id="live-not-found-home-link"][href="/"]')).toBeVisible();
    await expect(page.locator('[data-id="live-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-primary/);
    await expect(page.locator('[data-id="live-not-found-home-link"] .ant-btn')).toHaveClass(/ant-btn-sm/);

    const requests = await readRequests(request);
    const liveInfoRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/config/missing-live');
    const liveRanklistRequests = requests.filter((requestRecord) => /^\/ranking\/[^/]+$/.test(requestRecord.path));

    expect(liveInfoRequests).toHaveLength(1);
    expect(liveRanklistRequests).toHaveLength(0);
  });

  test('renders the legacy live load error state with Ant Design refresh action', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await request.post(`${mockBaseURL}/__fail-live-info/live-test-key`);

    const response = await page.goto('/live/live-test-key');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Live | RankLand');
    await expect(page.locator('[data-id="live-error"]')).toBeVisible();
    await expect(page.locator('[data-id="live-error"] p')).toHaveText('An error occurred while loading data');
    await expect(page.locator('[data-id="live-error"]')).toHaveCSS('text-align', 'center');
    await expect(page.locator('[data-id="live-error"] pre')).toHaveCount(0);
    await expect(page.locator('[data-id="live-refresh"]')).toHaveText('Refresh');
    await expect(page.locator('[data-id="live-refresh"]')).toHaveClass(/ant-btn-primary/);
    await expect(page.locator('[data-id="live-refresh"]')).toHaveClass(/ant-btn-sm/);

    const requests = await readRequests(request);
    const liveInfoRequests = requests.filter((requestRecord) => requestRecord.path === '/ranking/config/live-test-key');
    const liveRanklistRequests = requests.filter((requestRecord) => /^\/ranking\/[^/]+$/.test(requestRecord.path));

    expect(liveInfoRequests).toHaveLength(1);
    expect(liveRanklistRequests).toHaveLength(0);
  });

  test('disables scroll-solution mode, preserves other queries, and closes the WebSocket', async ({ page, request }) => {
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&scrollSolution=1&focus=yes');

    const wsUrl = `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`;
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await page.locator('[data-id="live-scroll-solution-toggle"]').click();

    await expect(page).toHaveURL(/\/live\/live-test-key\?token=t0&focus=yes$/);
    await expect(page.locator('[data-id="live-scroll-solution"]')).toBeHidden();
    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __ranklandWsClosedUrls?: string[] }).__ranklandWsClosedUrls || []),
      )
      .toContain(wsUrl);
  });

  test('reconnects after unexpected WebSocket close while keeping the ranklist visible', async ({
    page,
    request,
  }) => {
    await denyExternalCalls(page);
    await stubWebSocket(page);
    await request.post(`${mockBaseURL}/__reset`);

    await page.goto('/live/live-test-key?token=t0&scrollSolution=1');

    const wsUrl = `ws://127.0.0.1:${mockPort}/ranking/record/live-rid-1?token=t0`;
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
    await page.evaluate((url) => {
      (
        window as unknown as {
          __ranklandEmitWsClose: (url: string) => void;
        }
      ).__ranklandEmitWsClose(url);
    }, wsUrl);

    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('reconnecting');
    await expect(page.locator('[data-id="live-ranklist-content"]')).toBeVisible();
    await expect(page.locator('.srk-user-cell', { hasText: 'Team Alpha' })).toBeVisible();
    await expect
      .poll(async () => readRanklandWebSocketUrls(page))
      .toEqual([wsUrl, wsUrl]);
    await expect(page.locator('[data-id="live-scroll-solution-status"]')).toHaveText('connected');
  });
});
