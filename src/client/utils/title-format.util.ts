const SITE_NAME = 'RankLand';

export function formatTitle(title?: string): string {
  const normalizedTitle = title?.trim();
  if (!normalizedTitle) return SITE_NAME;
  return `${normalizedTitle} | ${SITE_NAME}`;
}
