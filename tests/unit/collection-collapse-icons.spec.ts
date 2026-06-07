import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('collection collapse icon parity', () => {
  it('uses Ant Design Vue fold and unfold icons instead of hand-written SVG paths', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/client/modules/collection/collection.view.vue'), 'utf8');

    expect(source).toContain("import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue';");
    expect(source).toMatch(/components:\s*{[\s\S]*MenuFoldOutlined,[\s\S]*MenuUnfoldOutlined,/);
    expect(source).toContain('<MenuUnfoldOutlined v-if="collapsed" />');
    expect(source).toContain('<MenuFoldOutlined />');
    expect(source).not.toContain(
      '<path d="M112 192h800v96H112zM112 468h480v88H112zM112 736h800v96H112zM704 384l192 128-192 128z" />',
    );
    expect(source).not.toContain(
      '<path d="M112 192h800v96H112zM432 468h480v88H432zM112 736h800v96H112zM320 384 128 512l192 128z" />',
    );
  });
});
