export interface RanklandFooterSiteEnv {
  RANKLAND_SITE_ALIAS?: string;
  SITE_ALIAS?: string;
  BEIAN?: string;
}

export interface RanklandFooterSiteState {
  showBeian: boolean;
  beianText: string;
}

export function createRanklandFooterSiteState(env: RanklandFooterSiteEnv = process.env): RanklandFooterSiteState {
  const siteAlias = env.RANKLAND_SITE_ALIAS || env.SITE_ALIAS;

  return {
    showBeian: siteAlias === 'cnn',
    beianText: env.BEIAN || '',
  };
}
