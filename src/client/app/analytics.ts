import type { Router } from 'vue-router';
import { formatCurrentUrl } from './current-url';
import { getRanklandRuntimeConfig } from './config';

declare global {
  interface Window {
    dataLayer?: Array<IArguments | unknown[]>;
    gtag?: (...args: unknown[]) => void;
    __ranklandAnalyticsInstalled?: boolean;
  }
}

export function installRanklandAnalytics(router: Router, win: Window = window) {
  const config = getRanklandRuntimeConfig();
  if (!config.gtag) {
    return;
  }
  if (win.__ranklandAnalyticsInstalled) {
    return;
  }
  win.__ranklandAnalyticsInstalled = true;

  ensureGtag(config.gtag, win);
  sendPageView(router.currentRoute.value.path, router.currentRoute.value.query, config.gtag, win);
  router.afterEach((to) => {
    sendPageView(to.path, to.query, config.gtag, win);
  });
}

function ensureGtag(tagId: string, win: Window) {
  if (typeof win.gtag !== 'function') {
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag() {
      win.dataLayer?.push(arguments);
    };
    win.gtag('js', new Date());
  }

  const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
  if (!win.document?.createElement || !win.document.head?.appendChild) {
    return;
  }
  if (win.document.querySelector?.(`script[src="${scriptSrc}"]`)) {
    return;
  }
  const script = win.document.createElement('script');
  script.async = true;
  script.src = scriptSrc;
  win.document.head.appendChild(script);
}

function sendPageView(pathname: string, query: Record<string, unknown>, tagId: string, win: Window) {
  win.setTimeout(() => {
    const url = formatCurrentUrl({
      protocol: win.location.protocol,
      host: win.location.host,
      pathname,
      query,
    });
    win.gtag?.('config', tagId, {
      page_path: url.url,
      page_location: url.fullUrl,
    });
  }, 500);
}
