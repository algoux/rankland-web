import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';
import ranklistFixture from '../../fixtures/ranklist.srk.json';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function readRequests(request: APIRequestContext) {
  const response = await request.get(`${mockBaseURL}/__requests`);
  return (await response.json()) as Array<{ path: string; search: string }>;
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

async function markPlaygroundWelcomeRead(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem('PlaygroundWelcomeMessageRead', 'true'));
}

async function emulateDarkSystemTheme(page: Page) {
  await page.addInitScript(() => {
    const darkQuery = '(prefers-color-scheme: dark)';
    const createMediaQueryList = (query: string) => ({
      matches: query === darkQuery,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => createMediaQueryList(query),
      writable: true,
    });
  });
}

async function replaceMonacoSource(page: Page, source: string) {
  // Monaco's synthetic editing path is not stable in this Vite 2 full-chain harness.
  await page.evaluate((nextSource) => {
    const win = window as typeof window & {
      __ranklandPreviewPlaygroundSource?: (source: string) => void;
    };

    win.__ranklandPreviewPlaygroundSource?.(nextSource);
  }, source);
}

async function expectMonacoReady(page: Page) {
  await expect(page.locator('[data-id="playground-editor-ready"]')).toHaveText('ready', { timeout: 15_000 });
}

test.describe('/playground full-chain route', () => {
  test('shows the one-time welcome modal and persists the read marker', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('PlaygroundWelcomeStorageSeeded') === 'true') {
        return;
      }

      window.localStorage.removeItem('PlaygroundWelcomeMessageRead');
      window.sessionStorage.setItem('PlaygroundWelcomeStorageSeeded', 'true');
    });

    const response = await page.goto('/playground');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expectMonacoReady(page);
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText('欢迎来到演练场！');
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText('调试标准榜单格式');
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText(
      '需要参考 srk 文档？请点击右上角的',
    );
    await expect(page.locator('[data-id="playground-welcome-modal"] .anticon-question-circle')).toBeVisible();
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText('图标。');
    await expect(page.locator('[data-id="playground-welcome-modal"]')).not.toContainText('页面中的 srk 文档入口');

    await page.locator('[data-id="playground-welcome-ok"]').click();

    await expect(page.locator('[data-id="playground-welcome-modal"]')).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('PlaygroundWelcomeMessageRead')))
      .toBe('true');

    await page.reload();

    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toHaveCount(0);

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });

  test('hydrates the CSR playground and previews bundled SRK without upstream calls', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);

    const response = await page.goto('/playground');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('Playground | RankLand', { timeout: 15_000 });
    await expect(page.locator('[data-id="playground-page"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveCSS('width', '1px');
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveCSS('height', '1px');
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveCSS('position', 'absolute');
    await expect(page.locator('.playground-toolbar')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Playground' })).toHaveCount(0);
    await expectMonacoReady(page);
    const editorReadyMarker = page.locator('[data-id="playground-editor-ready"]');
    await expect(editorReadyMarker).toHaveText('ready');
    await expect(editorReadyMarker).toHaveCSS('position', 'absolute');
    await expect(editorReadyMarker).toHaveCSS('width', '1px');
    await expect(editorReadyMarker).toHaveCSS('height', '1px');
    await expect(editorReadyMarker).toHaveCSS('overflow', 'hidden');
    await expect(editorReadyMarker).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('[data-id="playground-editor"] .monaco-editor')).toBeVisible();
    await expect(page.locator('[data-id="playground-preview-action"]')).toHaveCount(0);
    await expect(page.locator('[data-id="playground-editor"]')).toHaveAttribute('data-editor-language', 'json');
    await expect(page.locator('[data-id="playground-editor"]')).toHaveAttribute('data-editor-diagnostics', 'srk-schema');
    await expect(page.locator('[data-id="playground-editor"]')).toHaveCSS('border-top-width', '0px');
    await expect(page.locator('[data-id="playground-editor"]')).toHaveCSS('border-radius', '0px');
    await expect(page.locator('.playground-layout')).toHaveCSS('display', 'flex');
    await expect(page.locator('.playground-layout')).toHaveCSS('max-width', 'none');
    await expect(page.locator('.playground-layout')).toHaveClass(/(^|\s)srk-playground-container(\s|$)/);
    await expect(page.locator('.playground-editor-pane')).toHaveCSS('width', '500px');
    await expect(page.locator('.playground-preview-pane')).toHaveCSS('flex-grow', '1');
    await expect(page.locator('.playground-preview-pane')).toHaveClass(/(^|\s)srk-playground-preview(\s|$)/);
    await expect(page.locator('[data-id="playground-docs-link"]')).toHaveAttribute(
      'href',
      'https://srk.algoux.org/zh/',
    );
    await expect(page.locator('[data-id="playground-docs-link"]')).toHaveAttribute('target', '_blank');
    expect(await page.locator('[data-id="playground-docs-link"]').getAttribute('rel')).toBeNull();
    const docsLinkWrapper = page.locator('.playground-preview-pane > .absolute.right-4.top-4');
    await expect(docsLinkWrapper).toHaveCount(1);
    await expect(docsLinkWrapper).toHaveClass('absolute right-4 top-4');
    const docsLink = docsLinkWrapper.locator('[data-id="playground-docs-link"]');
    await expect(docsLink).toBeVisible();
    expect(await docsLink.getAttribute('class')).toBeNull();
    await expect(page.locator('[data-id="playground-docs-link"] .anticon-question-circle')).toBeVisible();
    await expect(docsLinkWrapper).toHaveCSS('position', 'absolute');
    await expect(docsLinkWrapper).toHaveCSS('right', '16px');
    await expect(docsLinkWrapper).toHaveCSS('top', '16px');
    await expect(page.locator('[data-id="playground-preview"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-preview-meta"]')).toHaveCount(0);
    await expect(page.locator('[data-id="playground-row-count"]')).toHaveCount(0);
    await expect(page.locator('[data-id="playground-preview"]')).toHaveJSProperty('tagName', 'DIV');
    await expect(page.locator('[data-id="playground-preview"]')).toHaveClass('mt-8 mb-8');
    await expect(page.locator('[data-id="playground-preview"]')).toHaveCSS('margin-top', '32px');
    await expect(page.locator('[data-id="playground-preview"]')).toHaveCSS('margin-bottom', '32px');
    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText(
      'ACM-ICPC World Finals 2018 (Excerpt Demo)',
    );
    await expect(page.locator('[data-id="rankland-ranklist-time"]')).toHaveText(
      '2018-04-19 17:00:00 ~ 2018-04-19 22:00:00 +08:00',
    );
    await expect(page.locator('[data-id="rankland-ranklist-filters"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-progress"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-organization-filter"]')).toHaveClass(/ant-select/);
    await expect(page.locator('[data-id="rankland-ranklist-official-filter"]')).toHaveClass(/ant-switch/);
    expect(await page.locator('[data-id="rankland-ranklist-table-wrapper"]').getAttribute('class')).toBeNull();
    await expect(page.getByText('Seoul National University')).toBeVisible();

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });

  test('preserves the legacy empty user organization line in the SRK user modal', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);

    await page.goto('/playground');
    await expectMonacoReady(page);

    const source = JSON.parse(JSON.stringify(ranklistFixture));
    source.contest.title = 'Empty Organization User Modal Fixture';
    delete source.rows[0].user.organization;
    await replaceMonacoSource(page, JSON.stringify(source));

    await expect(page.locator('[data-id="rankland-ranklist-title"]')).toHaveText(
      'Empty Organization User Modal Fixture',
    );
    await page.locator('.srk-user-cell', { hasText: 'Team Alpha' }).click();

    const userModal = page.locator('[data-id="rankland-ranklist-user-modal"]');
    await expect(userModal.locator('.srk-modal')).toBeVisible();
    const organizationLine = userModal.locator('[data-id="rankland-user-modal-organization"]');
    await expect(organizationLine).toHaveCount(1);
    await expect(organizationLine).toHaveText('');
    await expect(organizationLine).toHaveClass(/(^|\s)mb-0(\s|$)/);
    expect(await organizationLine.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    })).toMatchObject({
      marginTop: '0px',
      marginBottom: '0px',
    });
  });

  test('shows invalid JSON state after previewing malformed source', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);
    await page.goto('/playground');

    await expectMonacoReady(page);
    await replaceMonacoSource(page, '{');

    await expect(page.locator('[data-id="playground-invalid-json"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-invalid-json"]')).toContainText(
      'Input valid srk JSON and press Ctrl/Cmd + S to preview',
    );
    await expect(page.locator('[data-id="playground-invalid-json"] h3')).toHaveClass(/(^|\s)mt-16(\s|$)/);
    await expect(page.locator('[data-id="playground-invalid-json"] h3')).toHaveClass(/(^|\s)text-center(\s|$)/);
    await expect(page.locator('[data-id="playground-invalid-json"]')).toHaveCSS('margin-top', '64px');
    await expect(page.locator('[data-id="playground-invalid-json"]')).toHaveCSS('text-align', 'center');
    await expect(page.locator('[data-id="playground-invalid-json"] .playground-shortcut-tag')).toHaveClass(
      /(^|\s)mr-0(\s|$)/,
    );
    await expect(page.locator('[data-id="playground-invalid-json"] .playground-shortcut-tag')).toHaveCSS(
      'margin-right',
      '0px',
    );
    await expect(page.locator('[data-id="playground-invalid-json"] .playground-shortcut-tag')).toHaveCSS(
      'margin-left',
      '0px',
    );
    await expect(page.locator('[data-id="playground-invalid-json"] pre')).toHaveCount(0);

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });

  test('preserves the legacy checker error DOM for object JSON that is not valid SRK', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);
    await page.goto('/playground');

    await expectMonacoReady(page);
    await replaceMonacoSource(page, '{"type":"general"}');

    const checkError = page.locator('[data-id="rankland-ranklist-check-error"]');
    await expect(checkError).toBeVisible();
    await expect(checkError).toHaveClass(/^ml-8$/);
    await expect(checkError).not.toHaveClass(/rankland-ranklist-check-error/);
    await expect(checkError.locator('h3')).toHaveText('Error occurred while checking srk:');
    await expect(checkError.locator('pre')).not.toBeEmpty();
    await expect(checkError).toHaveCSS('margin-left', '32px');
    await expect(page.locator('[data-id="rankland-ranklist-render-error"]')).toHaveCount(0);

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });

  test('keeps playground editor and preview within desktop and mobile viewport bounds', async ({
    page,
    request,
  }, testInfo) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopResponse = await page.goto('/playground');

    expect(desktopResponse).not.toBeNull();
    expect(desktopResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="playground-page"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveText('hydrated');
    await expectMonacoReady(page);
    await expect(page.locator('[data-id="playground-preview"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="playground-editor"]'), page);
    await expect(page.locator('[data-id="playground-preview-action"]')).toHaveCount(0);
    await expectElementWithinViewport(page.locator('[data-id="playground-preview"]'), page);
    await page.screenshot({
      path: testInfo.outputPath('playground-desktop.png'),
      fullPage: false,
      animations: 'disabled',
    });

    const mobilePage = await page.context().newPage();
    await denyExternalCalls(mobilePage);
    await markPlaygroundWelcomeRead(mobilePage);
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await mobilePage.goto('/playground');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(mobilePage.locator('[data-id="playground-page"]')).toBeVisible();
    await expect(mobilePage.locator('[data-id="playground-hydrated"]')).toHaveText('hydrated');
    await expectMonacoReady(mobilePage);
    await expect(mobilePage.locator('[data-id="playground-preview"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(mobilePage);
    await expectElementWithinViewport(mobilePage.locator('[data-id="playground-editor"]'), mobilePage);
    await expect(mobilePage.locator('[data-id="playground-preview-action"]')).toHaveCount(0);
    await expectElementWithinViewport(mobilePage.locator('[data-id="playground-preview"]'), mobilePage);
    await mobilePage.screenshot({
      path: testInfo.outputPath('playground-mobile.png'),
      fullPage: false,
      animations: 'disabled',
    });
    await mobilePage.close();
  });

  test('uses the dark Monaco theme when the RankLand shell is dark', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);
    await emulateDarkSystemTheme(page);

    const response = await page.goto('/playground');

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
    await expectMonacoReady(page);
    await expect(page.locator('[data-id="playground-editor"]')).toHaveAttribute('data-editor-theme', 'vs-dark');

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });
});
