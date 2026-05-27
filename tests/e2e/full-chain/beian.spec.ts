import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;
const siteAlias = process.env.RANKLAND_SITE_ALIAS || process.env.SITE_ALIAS;
const expectedBeianText = process.env.BEIAN || '';

test.skip(siteAlias !== 'cnn', 'beian link parity is only rendered for the cnn site alias');

test.describe('beian link full-chain parity', () => {
  test('renders legacy beian links without rel on Home and SRK footer', async ({ page, request }) => {
    await denyExternalCalls(page);
    await request.post(`${mockBaseURL}/__reset`);

    const homeResponse = await page.goto('/');
    expect(homeResponse).not.toBeNull();
    expect(homeResponse?.ok()).toBe(true);

    const homeBeianLink = page.locator('[data-id="home-beian-link"]');
    await expect(homeBeianLink).toBeVisible();
    await expect(homeBeianLink).toHaveText(expectedBeianText);
    await expect(homeBeianLink).toHaveAttribute('href', 'https://beian.miit.gov.cn/');
    await expect(homeBeianLink).toHaveAttribute('target', '_blank');
    expect(await homeBeianLink.getAttribute('rel')).toBeNull();

    const ranklistResponse = await page.goto('/ranklist/test-key');
    expect(ranklistResponse).not.toBeNull();
    expect(ranklistResponse?.ok()).toBe(true);

    const ranklistBeianLink = page.locator('[data-id="rankland-ranklist-beian-link"]');
    await expect(ranklistBeianLink).toBeVisible();
    await expect(ranklistBeianLink).toHaveText(expectedBeianText);
    await expect(ranklistBeianLink).toHaveAttribute('href', 'https://beian.miit.gov.cn/');
    await expect(ranklistBeianLink).toHaveAttribute('target', '_blank');
    expect(await ranklistBeianLink.getAttribute('rel')).toBeNull();
  });
});
