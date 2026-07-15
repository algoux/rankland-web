import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';

export const PUBLIC_CONTEST_VIEW_ROUTE = /\/api\/v2\/public\/contests\/[^/?]+\/views(?:\?.*)?$/;

export async function blockPublicContestViewReports(target: Page | BrowserContext) {
  await target.route(PUBLIC_CONTEST_VIEW_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, code: 0, data: null }),
    });
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await blockPublicContestViewReports(page);
    await use(page);
  },
});

export { expect };
