export interface SrkAssetUrlOptions {
  storageBase?: string;
}

type SrkStorageEnv = Partial<Record<'RANKLAND_SRK_STORAGE_BASE' | 'SRK_STORAGE_BASE', string>>;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

export function getSrkStorageBase(env: SrkStorageEnv = process.env): string {
  const storageBase = env.RANKLAND_SRK_STORAGE_BASE || env.SRK_STORAGE_BASE || '';
  return trimTrailingSlash(storageBase);
}

export function formatSrkAssetUrl(url: string, assetIdScope?: string, options: SrkAssetUrlOptions = {}): string {
  if (url.startsWith('//')) {
    return url;
  }

  const protocolMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase();
    if (protocol === 'http' || protocol === 'https' || protocol === 'data') {
      return url;
    }
    console.warn(`unsupported protocol "${protocol}" in srk asset url:`, url);
    return '';
  }

  if (!assetIdScope) {
    console.warn('assetIdScope is required for srk asset url:', url);
    return '';
  }

  const storageBase = trimTrailingSlash(options.storageBase !== undefined ? options.storageBase : getSrkStorageBase());
  if (!storageBase) {
    console.warn('SRK storage base is required for srk asset url:', url);
    return '';
  }

  return `${storageBase}/${assetIdScope}${url.startsWith('/') ? '' : '/'}${url}`;
}
