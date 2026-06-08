const SITE_NAME = 'RankLand';

export function formatTitle(title?: string) {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}
