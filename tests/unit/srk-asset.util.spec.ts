import { describe, expect, it, vi } from 'vitest';
import { formatSrkAssetUrl, getSrkStorageBase } from '@client/utils/srk-asset.util';

describe('formatSrkAssetUrl', () => {
  it('returns protocol-relative URLs as-is', () => {
    expect(formatSrkAssetUrl('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png');
  });

  it('returns http, https, and data URLs unchanged', () => {
    expect(formatSrkAssetUrl('http://example.com/x.png')).toBe('http://example.com/x.png');
    expect(formatSrkAssetUrl('https://example.com/x.png')).toBe('https://example.com/x.png');
    expect(formatSrkAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(formatSrkAssetUrl('HTTPS://EXAMPLE.com/x.png')).toBe('HTTPS://EXAMPLE.com/x.png');
  });

  it('returns empty string for unsupported protocols', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(formatSrkAssetUrl('ftp://example.com/x.png')).toBe('');
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('joins relative paths with storage base and asset scope', () => {
    expect(
      formatSrkAssetUrl('logo.png', 'scope-1', {
        storageBase: 'https://assets.example/srk',
      }),
    ).toBe('https://assets.example/srk/scope-1/logo.png');
    expect(
      formatSrkAssetUrl('/logo.png', 'scope-1', {
        storageBase: 'https://assets.example/srk/',
      }),
    ).toBe('https://assets.example/srk/scope-1/logo.png');
  });

  it('returns empty string when relative paths are missing scope or storage base', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(formatSrkAssetUrl('logo.png', undefined, { storageBase: 'https://assets.example/srk' })).toBe('');
    expect(formatSrkAssetUrl('logo.png', 'scope-1', { storageBase: '' })).toBe('');
    expect(warn).toHaveBeenCalledTimes(2);

    warn.mockRestore();
  });
});

describe('getSrkStorageBase', () => {
  it('prefers RANKLAND_SRK_STORAGE_BASE and falls back to SRK_STORAGE_BASE', () => {
    expect(
      getSrkStorageBase({
        RANKLAND_SRK_STORAGE_BASE: 'https://rankland-assets.example/',
        SRK_STORAGE_BASE: 'https://legacy-assets.example/',
      }),
    ).toBe('https://rankland-assets.example');
    expect(getSrkStorageBase({ SRK_STORAGE_BASE: 'https://legacy-assets.example/' })).toBe(
      'https://legacy-assets.example',
    );
  });
});
