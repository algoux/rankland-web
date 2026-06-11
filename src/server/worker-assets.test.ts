import { describe, expect, it } from 'vitest';

const viteConfig = require('../../vite.config.js');
const { shouldUploadDistFile } = require('../../scripts/upload-cos-lib.cjs');

describe('worker assets', () => {
  it('serves only worker build assets from same-origin /dist URLs', () => {
    const config = viteConfig({ command: 'build' });
    const renderBuiltUrl = config.experimental.renderBuiltUrl;

    expect(renderBuiltUrl('assets/rank-time-data.worker-58b7b4e9.js', {})).toBe(
      '/dist/assets/rank-time-data.worker-58b7b4e9.js',
    );
    expect(renderBuiltUrl('assets/editor.worker-7a35bb28.js', {})).toBe('/dist/assets/editor.worker-7a35bb28.js');
    expect(renderBuiltUrl('assets/json.worker-432a81d8.js', {})).toBe('/dist/assets/json.worker-432a81d8.js');
    expect(renderBuiltUrl('assets/index-288dc2dc.js', {})).toBeUndefined();
    expect(renderBuiltUrl('assets/StyledRanklist-4e8e13a8.css', {})).toBeUndefined();
  });

  it('skips same-origin worker assets when uploading dist files to COS', () => {
    expect(shouldUploadDistFile('assets/rank-time-data.worker-58b7b4e9.js')).toBe(false);
    expect(shouldUploadDistFile('assets/editor.worker-7a35bb28.js')).toBe(false);
    expect(shouldUploadDistFile('assets/json.worker-432a81d8.js')).toBe(false);
    expect(shouldUploadDistFile('assets/index-288dc2dc.js')).toBe(true);
    expect(shouldUploadDistFile('assets/style-288dc2dc.css')).toBe(true);
    expect(shouldUploadDistFile('assets/index-288dc2dc.js.map')).toBe(false);
  });
});
