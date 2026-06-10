import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('robots.txt', () => {
  it('points crawlers to the fixed-cn root sitemap index', () => {
    const robots = readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf-8');

    expect(robots).toBe('User-agent: *\nDisallow: /api/\nSitemap: https://rl.algoux.cn/sitemap.xml\n');
    expect(robots).not.toContain('rl.algoux.org');
  });
});
