import { expect, test } from '@playwright/test';

const VIN_ROUTE = '**/vin.txt';
const VIN_TOAST = '[data-sonner-toast][data-type="warning"]';

test.describe('very important notice', () => {
  test('shows an unread notice until manual dismissal and remembers its ID', async ({ page }) => {
    let vinContent = 'VIN:maintenance-1:Planned maintenance';
    await page.route(VIN_ROUTE, (route) => route.fulfill(vinResponse(200, vinContent)));

    await page.goto('/ranklist/test-key?focus=yes');

    const toaster = page.locator('[data-sonner-toaster]');
    const notice = page.locator(VIN_TOAST);
    await expect(toaster).toHaveAttribute('data-y-position', 'top');
    await expect(toaster).toHaveAttribute('data-x-position', 'center');
    await expect(notice).toContainText('Planned maintenance');
    await expect(notice.locator('[data-close-button="true"]')).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('RanklandVinReadIds'))).toBeNull();

    await page.waitForTimeout(4_500);
    await expect(notice).toBeVisible();
    await notice.locator('[data-close-button="true"]').click();
    await expect(notice).toBeHidden();
    expect(await page.evaluate(() => window.localStorage.getItem('RanklandVinReadIds')))
      .toBe('["maintenance-1"]');

    const readNoticeResponse = page.waitForResponse((response) => response.url().endsWith('/vin.txt'));
    await page.reload();
    await readNoticeResponse;
    await page.waitForTimeout(100);
    await expect(page.locator(VIN_TOAST)).toHaveCount(0);

    vinContent = 'VIN:maintenance-2:Follow-up notice';
    await page.reload();
    await expect(page.locator(VIN_TOAST)).toContainText('Follow-up notice');
  });

  test('keeps 404 silent and logs other HTTP errors without UI', async ({ page }) => {
    let status = 404;
    const vinErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().startsWith('[VIN]')) {
        vinErrors.push(message.text());
      }
    });
    await page.route(VIN_ROUTE, (route) => route.fulfill(vinResponse(status, 'VIN:ignored:Ignored')));

    const missingResponse = page.waitForResponse((response) => response.url().endsWith('/vin.txt'));
    await page.goto('/');
    await missingResponse;
    await expect(page.locator(VIN_TOAST)).toHaveCount(0);
    expect(vinErrors).toEqual([]);

    status = 500;
    const errorResponse = page.waitForResponse((response) => response.url().endsWith('/vin.txt'));
    await page.reload();
    await errorResponse;
    await expect(page.locator(VIN_TOAST)).toHaveCount(0);
    await expect.poll(() => vinErrors.length).toBe(1);
    expect(vinErrors[0]).toMatch(
      /^\[VIN\] .*\/vin\.txt responded with HTTP 500 Internal Server Error$/,
    );
  });
});

function vinResponse(status: number, body: string) {
  return {
    status,
    contentType: 'text/plain; charset=utf-8',
    headers: {
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    },
    body,
  };
}
