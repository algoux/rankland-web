import { describe, expect, it, vi } from 'vitest';
import { formatSrkAssetUrl } from './srk-asset.util';

describe('formatSrkAssetUrl', () => {
  it('returns absolute and protocol-relative URLs as-is', () => {
    expect(formatSrkAssetUrl('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png');
    expect(formatSrkAssetUrl('https://example.com/x.png')).toBe('https://example.com/x.png');
    expect(formatSrkAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('joins relative paths with the configured storage base and asset scope', () => {
    expect(formatSrkAssetUrl('logo.png', 'scope-1')).toBe('https://cdn.algoux.cn/srk-storage/scope-1/logo.png');
    expect(formatSrkAssetUrl('/logo.png', 'scope-1')).toBe('https://cdn.algoux.cn/srk-storage/scope-1/logo.png');
  });

  it('returns an empty string for unsupported or unscoped paths', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(formatSrkAssetUrl('ftp://example.com/x.png')).toBe('');
    expect(formatSrkAssetUrl('logo.png')).toBe('');
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
