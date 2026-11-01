import { describe, expect, it } from 'vitest';

const { normalizeSsrManifest } = require('../../scripts/ssr-manifest-aliases.cjs');

describe('SSR component asset lookup', () => {
  it('resolves bare SFC modules and shared static CSS without warming dynamic chart code', () => {
    const input = {
      'src/Table.vue?vue&type=script&setup=true&lang.ts': ['/dist/assets/table.js', '/dist/assets/table.css'],
      'src/Footer.vue?vue&type=script&setup=true&lang.ts': ['/dist/assets/shared.js', '/dist/assets/shared.css'],
      'src/Chart.vue?vue&type=script&setup=true&lang.ts': ['/dist/assets/chart.js', '/dist/assets/chart.css'],
    };
    const original = JSON.stringify(input);
    const output = normalizeSsrManifest(input, {
      'assets/table.js': { type: 'chunk', fileName: 'assets/table.js', imports: ['assets/shared.js'], dynamicImports: ['assets/chart.js'], viteMetadata: { importedCss: new Set(['assets/table.css']) } },
      'assets/shared.js': { type: 'chunk', fileName: 'assets/shared.js', imports: [], viteMetadata: { importedCss: new Set(['assets/shared.css']) } },
    });
    expect(output['src/Table.vue']).toEqual(['/dist/assets/table.js', '/dist/assets/shared.css', '/dist/assets/table.css']);
    expect(output['src/Table.vue']).not.toContain('/dist/assets/chart.css');
    expect(JSON.stringify(input)).toBe(original);
  });

  it('merges existing entries, preserves CDN URLs, deduplicates, and leaves unrelated queries alone', () => {
    const input = {
      'src/Table.vue': ['https://cdn.example/dist/assets/table.css'],
      'src/Table.vue?vue&type=script': ['https://cdn.example/dist/assets/table.js', 'https://cdn.example/dist/assets/table.css'],
      'data.json?raw': ['/dist/assets/data.js'],
    };
    const output = normalizeSsrManifest(input);
    expect(output['src/Table.vue']).toEqual(['https://cdn.example/dist/assets/table.css', 'https://cdn.example/dist/assets/table.js']);
    expect(output['data.json']).toBeUndefined();
    expect(normalizeSsrManifest(output)).toEqual(output);
  });
});
