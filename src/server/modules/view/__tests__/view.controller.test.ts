import { describe, expect, it, vi } from 'vitest';
import { RenderMethodKind } from 'bwcx-client-vue';

vi.mock('bwcx-core', async () => {
  const actual = await vi.importActual<typeof import('bwcx-core')>('bwcx-core');
  return {
    ...actual,
    Inject: () => () => undefined,
  };
});

vi.mock('bwcx-ljsm', async () => {
  const actual = await vi.importActual<typeof import('bwcx-ljsm')>('bwcx-ljsm');
  return {
    ...actual,
    Controller: () => () => undefined,
    InjectCtx: () => () => undefined,
    Param: () => () => undefined,
    Query: () => () => undefined,
  };
});

vi.mock('bwcx-client-vue/server', () => ({
  OverrideView: () => () => undefined,
  PrimaryRenderMethod: () => () => undefined,
  UseClientRoutes: () => () => undefined,
}));

import ViewController from '../view.controller';

function createController({
  invokeSuccessfulSsrRender = true,
}: {
  invokeSuccessfulSsrRender?: boolean;
} = {}) {
  const ctx = {
    error: vi.fn(),
  };
  const service = {
    render: vi.fn(async (_mode: RenderMethodKind, options?: { onSuccessfulSsrRender?: () => void }) => {
      if (invokeSuccessfulSsrRender) {
        options?.onSuccessfulSsrRender?.();
      }
      return 'rendered-html';
    }),
  };
  const reportPromise = new Promise<void>(() => {
    // Deliberately unresolved to prove that the SSR response does not await reporting.
  });
  const contestService = {
    reportView: vi.fn(() => reportPromise),
  };
  return {
    controller: new ViewController(ctx as any, service as any, contestService as any),
    contestService,
    service,
  };
}

describe('ViewController contest view reporting', () => {
  it('returns successful SSR HTML without awaiting the ranklist view report', async () => {
    const { controller, contestService, service } = createController();

    await expect(controller.ranklistView(RenderMethodKind.SSR, 'regional-2026')).resolves.toBe('rendered-html');

    expect(service.render).toHaveBeenCalledWith(RenderMethodKind.SSR, {
      onSuccessfulSsrRender: expect.any(Function),
    });
    expect(contestService.reportView).toHaveBeenCalledWith('regional-2026');
  });

  it('reports the first collection rankId only for a successful effective SSR render', async () => {
    const successful = createController();
    await successful.controller.collectionView(RenderMethodKind.SSR, ['regional-2026', 'ignored']);
    expect(successful.contestService.reportView).toHaveBeenCalledWith('regional-2026');

    const unsuccessful = createController({ invokeSuccessfulSsrRender: false });
    await unsuccessful.controller.collectionView(RenderMethodKind.SSR, 'regional-2026');
    expect(unsuccessful.contestService.reportView).not.toHaveBeenCalled();

    const withoutRankId = createController();
    await withoutRankId.controller.collectionView(RenderMethodKind.SSR, undefined);
    expect(withoutRankId.service.render).toHaveBeenCalledWith(RenderMethodKind.SSR);
    expect(withoutRankId.contestService.reportView).not.toHaveBeenCalled();
  });
});
