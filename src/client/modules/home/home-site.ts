const DEFAULT_SITE_ORIGIN = 'https://rl.algoux.org';
const CNN_SITE_ORIGIN = 'https://rl.algoux.cn';

export function getHomeSiteOrigin(): string {
  if (process.env.RANKLAND_SITE_ORIGIN) {
    return process.env.RANKLAND_SITE_ORIGIN.replace(/\/$/, '');
  }

  const alias = process.env.RANKLAND_SITE_ALIAS || process.env.SITE_ALIAS;
  return alias === 'cnn' ? CNN_SITE_ORIGIN : DEFAULT_SITE_ORIGIN;
}

export function buildHomeAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getHomeSiteOrigin()}${normalizedPath}`;
}
