const CHINA_GA_TAG = 'G-D4PSNCRQJC';
const GLOBAL_GA_TAG = 'G-D6CVTJBDZT';

type AnalyticsEnv = Partial<Record<
  'RANKLAND_GTAG' | 'GTAG' | 'RANKLAND_SITE_ALIAS' | 'SITE_ALIAS' | 'RANKLAND_E2E_PROBE',
  string | undefined
>>;

export type RanklandAnalyticsProbeEvent =
  | { type: 'initialize'; tag: string }
  | { type: 'pageview'; page: string };

type RanklandAnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
  __ranklandAnalyticsEvents?: RanklandAnalyticsProbeEvent[];
  __ranklandAnalyticsInitializedTag?: string;
};

export function getRanklandGaTag(env: AnalyticsEnv = process.env): string {
  if (env.RANKLAND_GTAG) {
    return env.RANKLAND_GTAG;
  }

  if (env.GTAG) {
    return env.GTAG;
  }

  const siteAlias = env.RANKLAND_SITE_ALIAS || env.SITE_ALIAS;
  return siteAlias === 'cn' ? CHINA_GA_TAG : GLOBAL_GA_TAG;
}

export function buildRanklandAnalyticsPage(origin: string, fullPath: string): string {
  const normalizedOrigin = origin.replace(/\/$/, '');
  const pathWithoutHash = (fullPath || '/').split('#')[0] || '/';
  const normalizedPath = pathWithoutHash.startsWith('/') ? pathWithoutHash : `/${pathWithoutHash}`;

  return `${normalizedOrigin}${normalizedPath}`;
}

function shouldRecordAnalyticsProbe(env: AnalyticsEnv = process.env): boolean {
  return env.RANKLAND_E2E_PROBE === '1';
}

function recordRanklandAnalyticsProbeEvent(event: RanklandAnalyticsProbeEvent) {
  if (!shouldRecordAnalyticsProbe() || typeof window === 'undefined') {
    return;
  }

  const win = window as RanklandAnalyticsWindow;
  win.__ranklandAnalyticsEvents = win.__ranklandAnalyticsEvents || [];
  win.__ranklandAnalyticsEvents.push(event);
}

export function initializeRanklandAnalytics(tag = getRanklandGaTag()) {
  if (!tag || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const win = window as RanklandAnalyticsWindow;
  win.dataLayer = win.dataLayer || [];
  win.gtag = win.gtag || ((...args: unknown[]) => {
    win.dataLayer?.push(args);
  });

  if (!document.querySelector('script[data-rankland-analytics="gtag"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tag)}`;
    script.setAttribute('data-rankland-analytics', 'gtag');
    document.head.appendChild(script);
  }

  if (win.__ranklandAnalyticsInitializedTag === tag) {
    return;
  }

  win.__ranklandAnalyticsInitializedTag = tag;
  win.gtag('js', new Date());
  win.gtag('config', tag, { send_page_view: false });
  recordRanklandAnalyticsProbeEvent({ type: 'initialize', tag });
}

export function sendRanklandPageview(page: string) {
  if (!page || typeof window === 'undefined') {
    return;
  }

  const win = window as RanklandAnalyticsWindow;
  win.gtag?.('event', 'page_view', {
    page_location: page,
    page_path: page,
  });
  recordRanklandAnalyticsProbeEvent({ type: 'pageview', page });
}
