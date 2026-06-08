import { getRanklandRuntimeConfig } from '@/app/config';

export function formatSrkAssetUrl(url: string, assetIdScope?: string): string {
  if (url.startsWith('//')) {
    return url;
  }
  const protocol = /^([^:]+):/.exec(url)?.[1]?.toLowerCase();
  if (protocol) {
    if (['http', 'https', 'data'].includes(protocol)) {
      return url;
    }
    console.warn(`unsupported protocol "${protocol}" in srk asset url:`, url);
    return '';
  }

  if (!assetIdScope) {
    console.warn('assetIdScope is required for srk asset url:', url);
    return '';
  }

  const config = getRanklandRuntimeConfig();
  return `${config.srkStorageBase.replace(/\/+$/, '')}/${assetIdScope}${url.startsWith('/') ? '' : '/'}${url}`;
}
