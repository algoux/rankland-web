import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

async function readRequests(request: APIRequestContext) {
  const response = await request.get(`${mockBaseURL}/__requests`);
  return (await response.json()) as Array<{ path: string; search: string }>;
}

test.describe('/playground full-chain route', () => {
  test('hydrates the CSR playground and previews bundled SRK without upstream calls', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

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
});
