import { expect, test } from '@playwright/test';
import { denyExternalCalls } from '../helpers/mock-api';

const mockPort = process.env.FULL_CHAIN_MOCK_PORT || '3101';
const mockBaseURL = `http://127.0.0.1:${mockPort}`;

test('RankLand probe loads through the real app server and mock backend', async ({ page, request }) => {
  await denyExternalCalls(page);
  await request.post(`${mockBaseURL}/__reset`);

  const response = await page.goto('/__e2e/rankland-probe/test-key');

  expect(response).not.toBeNull();
  expect(response?.ok()).toBe(true);
  expect(await response!.text()).toContain('Test Contest 2024');
  await expect(page.getByTestId('rankland-probe-title')).toHaveText('Test Contest 2024');
  await expect(page.getByTestId('rankland-probe-key')).toHaveText('test-key');
  await expect(page.getByTestId('rankland-probe-row-count')).toHaveText('2');
  await expect(page.getByTestId('rankland-probe-total-srk-count')).toHaveText('1234');
  await expect(page.getByTestId('rankland-probe-render-source')).toHaveText('asyncData');
  await expect(page.getByTestId('rankland-probe-hydrated')).toHaveText('hydrated');
  await expect(page.getByTestId('rankland-probe-client-refresh-count')).toHaveText('0');

  await page.getByTestId('rankland-probe-refresh').click();

  await expect(page.getByTestId('rankland-probe-client-refresh-count')).toHaveText('1234');

  const requestsResponse = await request.get(`${mockBaseURL}/__requests`);
  const requests = (await requestsResponse.json()) as Array<{ path: string }>;
  const statisticsRequests = requests.filter((requestRecord) => requestRecord.path === '/statistics');

  expect(requests.some((requestRecord) => requestRecord.path === '/rank/test-key')).toBe(true);
  expect(requests.some((requestRecord) => requestRecord.path === '/file/download')).toBe(true);
  expect(statisticsRequests).toHaveLength(2);
});
