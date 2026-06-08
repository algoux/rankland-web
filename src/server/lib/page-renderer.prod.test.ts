import { describe, expect, it } from 'vitest';
import { resolveRenderedStatus } from './page-renderer.prod';

describe('PageRendererProd', () => {
  it('uses explicit default statuses only when vite-ssr did not write one', () => {
    expect(resolveRenderedStatus(undefined, 404)).toBe(404);
    expect(resolveRenderedStatus(301, 404)).toBe(301);
    expect(resolveRenderedStatus(undefined, undefined)).toBe(200);
  });
});
