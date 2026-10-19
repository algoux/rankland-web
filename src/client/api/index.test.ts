import Axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientFactory } from './index';

describe('ApiClientFactory', () => {
  it('forwards an extra AbortSignal into the Axios request config', async () => {
    const adapter = vi.fn(async (config) => ({
      config,
      data: {
        success: true,
        data: {
          uk: 'summer-2026',
          lastEventId: 12,
          streamRevision: 3,
        },
      },
      headers: {},
      status: 200,
      statusText: 'OK',
    }));
    const client = ApiClientFactory.createInstance(Axios.create({ adapter }));
    const controller = new AbortController();

    await client.getPublicContestEventStream(
      { uk: 'summer-2026' },
      { signal: controller.signal },
    );

    expect(adapter).toHaveBeenCalledOnce();
    expect(adapter.mock.calls[0][0].signal).toBe(controller.signal);
  });
});
