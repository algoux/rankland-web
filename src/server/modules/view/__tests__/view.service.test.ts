import { describe, expect, it, vi } from 'vitest';
import { RenderMethodKind } from 'bwcx-client-vue';
import ViewService from '../view.service';
import type { IPageRenderer } from '@server/lib/page-renderer.interface';

function createService(query: Record<string, unknown> = {}) {
  const renderer = {
    render: vi.fn(async (mode: 'ssr' | 'csr') => `${mode}-html`),
  } satisfies Pick<IPageRenderer, 'render'>;
  const ctx = { query } as any;
  return {
    service: new ViewService(ctx, renderer as IPageRenderer),
    renderer,
  };
}

describe('ViewService', () => {
  it.each(['0', 'false'])('forces CSR rendering when ssr=%s', async (value) => {
    const { service, renderer } = createService({ ssr: value });

    await expect(service.render(RenderMethodKind.SSR)).resolves.toBe('csr-html');

    expect(renderer.render).toHaveBeenCalledWith('csr', expect.any(Object), {});
  });

  it('keeps SSR rendering when the ssr query flag is absent', async () => {
    const { service, renderer } = createService();

    await expect(service.render(RenderMethodKind.SSR)).resolves.toBe('ssr-html');

    expect(renderer.render).toHaveBeenCalledWith('ssr', expect.any(Object), {});
  });
});
