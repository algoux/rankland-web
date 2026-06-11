import { describe, expect, it, vi } from 'vitest';
import { preloadRankCurveRenderer, resetRankCurveRendererPreloadForTest } from './rank-curve-loader';

describe('preloadRankCurveRenderer', () => {
  it('deduplicates the chart renderer import', async () => {
    resetRankCurveRendererPreloadForTest();
    const importer = vi.fn(async () => ({ Chart: class Chart {} }));

    const first = preloadRankCurveRenderer(importer);
    const second = preloadRankCurveRenderer(importer);

    expect(first).toBe(second);
    await expect(first).resolves.toHaveProperty('Chart');
    expect(importer).toHaveBeenCalledTimes(1);
  });
});
