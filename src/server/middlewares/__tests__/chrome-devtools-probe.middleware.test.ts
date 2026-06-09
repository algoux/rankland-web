import { describe, expect, it, vi } from 'vitest';
import {
  CHROME_DEVTOOLS_APPSPECIFIC_CONFIG_PATH,
  chromeDevtoolsProbeMiddleware,
} from '../chrome-devtools-probe.middleware';

describe('chromeDevtoolsProbeMiddleware', () => {
  it('short-circuits the Chrome DevTools app-specific config probe', async () => {
    const ctx = {
      url: `${CHROME_DEVTOOLS_APPSPECIFIC_CONFIG_PATH}?v=1`,
      status: undefined as number | undefined,
    } as any;
    const next = vi.fn();

    await chromeDevtoolsProbeMiddleware(ctx, next);

    expect(ctx.status).toBe(204);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes through unrelated requests', async () => {
    const ctx = {
      url: '/ranklist/icpc',
      status: undefined as number | undefined,
    } as any;
    const next = vi.fn();

    await chromeDevtoolsProbeMiddleware(ctx, next);

    expect(ctx.status).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
