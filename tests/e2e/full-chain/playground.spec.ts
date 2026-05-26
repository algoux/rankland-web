import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

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
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText('欢迎来到演练场！');
    await expect(page.locator('[data-id="playground-welcome-modal"]')).toContainText('调试标准榜单格式');

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
    await expect(page).toHaveTitle('Playground - RankLand');
    await expect(page.locator('[data-id="playground-page"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="playground-docs-link"]')).toHaveAttribute(
      'href',
      'https://srk.algoux.org/zh/',
    );
    await expect(page.locator('[data-id="playground-editor"]')).toHaveValue(/"type"/);
    await expect(page.locator('[data-id="playground-preview"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-row-count"]')).toHaveText('3');
    await expect(page.getByText('Seoul National University')).toBeVisible();

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });

  test('shows invalid JSON state after previewing malformed source', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);
    await page.goto('/playground');

    await page.locator('[data-id="playground-editor"]').fill('{');
    await page.locator('[data-id="playground-preview-action"]').click();

    await expect(page.locator('[data-id="playground-invalid-json"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-invalid-json"]')).toContainText(
      'Input valid srk JSON and press Ctrl/Cmd + S to preview',
    );

    const requests = await readRequests(request);
    expect(requests).toHaveLength(0);
  });

  test('contains renderer conversion errors for object JSON that is not renderable SRK', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);
    await markPlaygroundWelcomeRead(page);
    await page.goto('/playground');

    await page.locator('[data-id="playground-editor"]').fill('{"type":"general"}');
    await page.locator('[data-id="playground-preview-action"]').click();

    await expect(page.locator('[data-id="rankland-ranklist-render-error"]')).toBeVisible();
    await expect(page.locator('[data-id="rankland-ranklist-render-error"]')).toContainText(
      'Error occurred when rendering srk',
    );

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
    await expect(page.locator('[data-id="playground-preview"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="playground-editor"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="playground-preview-action"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="playground-preview"]'), page);
    await page.screenshot({ path: testInfo.outputPath('playground-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileResponse = await page.goto('/playground');

    expect(mobileResponse).not.toBeNull();
    expect(mobileResponse?.ok()).toBe(true);
    await expect(page.locator('[data-id="playground-page"]')).toBeVisible();
    await expect(page.locator('[data-id="playground-hydrated"]')).toHaveText('hydrated');
    await expect(page.locator('[data-id="playground-preview"]')).toBeVisible();
    await expectNoHorizontalDocumentOverflow(page);
    await expectElementWithinViewport(page.locator('[data-id="playground-editor"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="playground-preview-action"]'), page);
    await expectElementWithinViewport(page.locator('[data-id="playground-preview"]'), page);
    await page.screenshot({ path: testInfo.outputPath('playground-mobile.png'), fullPage: true });
  });
});
