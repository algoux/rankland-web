export type RankCurveRendererModule = typeof import('@antv/g2');
export type RankCurveRendererImporter = () => Promise<RankCurveRendererModule>;

let rendererPromise: Promise<RankCurveRendererModule> | null = null;

export function preloadRankCurveRenderer(
  importer: RankCurveRendererImporter = () => import('@antv/g2'),
) {
  if (!rendererPromise) {
    rendererPromise = importer().catch((error) => {
      rendererPromise = null;
      throw error;
    });
  }
  return rendererPromise;
}

export function resetRankCurveRendererPreloadForTest() {
  rendererPromise = null;
}
