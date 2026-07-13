import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { describe, expect, it, vi } from 'vitest';
import { loadVinNotice } from '@/app/vin';
import VinNotice from './VinNotice.vue';

vi.mock('@/app/vin', () => ({
  loadVinNotice: vi.fn(),
}));

describe('VinNotice', () => {
  it('does not load or render a VIN notice during SSR', async () => {
    const html = await renderToString(createSSRApp(VinNotice));

    expect(html).toBe('');
    expect(loadVinNotice).not.toHaveBeenCalled();
  });
});
