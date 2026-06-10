type RanklandRouteName = 'Home' | 'Search' | 'Ranklist' | 'Collection' | 'Playground' | 'Live';

declare const __RANKLAND_CLIENT_ENV__: Record<string, string | undefined> | undefined;

export interface RanklandRuntimeConfig {
  apiBaseClient: string;
  apiBaseServer: string;
  cdnApiBaseClient: string;
  cdnApiBaseServer: string;
  srkStorageBase: string;
  hostGlobal: string;
  hostCN: string;
  siteAlias: string;
  beian: string;
  livePollingInterval: number;
  wsBase: string;
  gtag: string;
  buildCommit: string;
}

const routeDefs: Array<{ name: RanklandRouteName; path: string }> = [
  { name: 'Home', path: '/' },
  { name: 'Search', path: '/search' },
  { name: 'Ranklist', path: '/ranklist/:id' },
  { name: 'Collection', path: '/collection/:id' },
  { name: 'Playground', path: '/playground' },
  { name: 'Live', path: '/live/:id' },
];

export const ranklandRoutes = {
  formatUrl(name: RanklandRouteName, params: Record<string, unknown> = {}) {
    const route = routeDefs.find((item) => item.name === name);
    if (!route) {
      throw new Error(`Route ${name} not found`);
    }

    const usedParams = new Set<string>();
    let path = route.path.replace(/:([^/]+)/g, (_match, key: string) => {
      usedParams.add(key);
      const value = params[key];
      if (value === undefined || value === null) {
        throw new Error(`Route ${name} requires param ${key}`);
      }
      return encodeURIComponent(String(value));
    });

    const queryString = serializeQuery(params, usedParams);
    if (queryString) {
      path += `?${queryString}`;
    }
    return path;
  },
};

export function getRanklandRuntimeConfig(env: Record<string, string | undefined> = resolveRanklandRuntimeEnv()): RanklandRuntimeConfig {
  return {
    apiBaseClient: env.API_BASE_CLIENT || 'https://rl-api.algoux.cn',
    apiBaseServer: env.API_BASE_SERVER || 'https://rl-api.algoux.cn',
    cdnApiBaseClient: env.CDN_API_BASE_CLIENT || 'https://rl-api.algoux.cn',
    cdnApiBaseServer: env.CDN_API_BASE_SERVER || 'https://rl-api.algoux.cn',
    srkStorageBase: env.SRK_STORAGE_BASE || 'https://cdn.algoux.cn/srk-storage',
    hostGlobal: env.HOST_GLOBAL || 'rl.algoux.org',
    hostCN: env.HOST_CN || 'rl.algoux.cn',
    siteAlias: env.SITE_ALIAS || 'global',
    beian: env.BEIAN || '',
    livePollingInterval: Number(env.LIVE_POLLING_INTERVAL || 10_000),
    wsBase: env.WS_BASE || '',
    gtag: env.GTAG || '',
    buildCommit: env.BUILD_COMMIT || '',
  };
}

export function getRanklandBuildCommitLink(config = getRanklandRuntimeConfig()) {
  const buildCommit = config.buildCommit.trim();
  if (!buildCommit) {
    return undefined;
  }
  return {
    label: buildCommit.length > 8 ? buildCommit.slice(0, 8) : buildCommit,
    href: `https://github.com/algoux/rankland-web/tree/${encodeURIComponent(buildCommit)}`,
  };
}

function resolveRanklandRuntimeEnv() {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    return process.env;
  }
  if (typeof __RANKLAND_CLIENT_ENV__ !== 'undefined') {
    return __RANKLAND_CLIENT_ENV__;
  }
  return {};
}

export function serializeQuery(params: Record<string, unknown>, usedParams = new Set<string>()) {
  return Object.entries(params)
    .flatMap(([key, value]) => {
      if (usedParams.has(key) || value === undefined || value === null) {
        return [];
      }
      const values = Array.isArray(value) ? value : [value];
      return values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
    })
    .join('&');
}

export function ranklandSiteOrigin(siteAlias = getRanklandRuntimeConfig().siteAlias) {
  return siteAlias === 'cnn' ? 'https://rl.algoux.cn' : 'https://rl.algoux.org';
}

export function getFullUrl(url: string, siteAlias = getRanklandRuntimeConfig().siteAlias) {
  return `${ranklandSiteOrigin(siteAlias)}${url.startsWith('/') ? url : `/${url}`}`;
}
