import type { Router } from 'vue-router';

const touchDevice = '(pointer: coarse) and (hover: none)';
const handheldViewport = `${touchDevice} and (max-device-width: 768px), ${touchDevice} and (max-device-height: 768px)`;
const ranklistRoutes = new Set(['Collection', 'Ranklist', 'LiveRanklist']);

export function installRanklistViewport(router: Router, win: Window = window) {
  const viewport = win.document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!viewport || !win.matchMedia(handheldViewport).matches) {
    return;
  }

  const defaultContent = viewport.content;
  const overviewContent = defaultContent.replace(/initial-scale=([^,]+)/, 'initial-scale=0.5');
  router.afterEach((to, _from, failure) => {
    if (failure) {
      return;
    }

    const overview = typeof to.name === 'string' && ranklistRoutes.has(to.name);
    const content = overview ? overviewContent : defaultContent;
    if (viewport.content !== content) {
      win.document.documentElement.toggleAttribute('data-ranklist-overview', overview);
      viewport.content = content;
    }
  });
}

export function getRanklistResponsiveWidth(win: Window = window) {
  const { documentElement } = win.document;
  if (!documentElement.hasAttribute('data-ranklist-overview')) {
    return win.innerWidth;
  }

  // An initial scale below 1 expands the layout viewport. Keep controls sized for the device.
  return Math.min(documentElement.clientWidth, win.screen.width);
}
