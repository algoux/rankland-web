export function isMacBlinkUserAgent(userAgent: string) {
  return /Macintosh|Mac OS X/.test(userAgent) && /(Chrome|Chromium|Edg)\//.test(userAgent);
}

export function applyMacBlinkOptimizations(win: Window = window) {
  if (isMacBlinkUserAgent(win.navigator.userAgent)) {
    win.document.body.classList.add('optimize-decrease-effects');
  }
}

export function initScrollbarMode() {
  // Setting an explicit WebKit scrollbar width would turn overlay bars into classic bars.
  const probe = document.createElement('div');
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    width: '100px',
    height: '100px',
    overflow: 'scroll',
    scrollbarWidth: 'auto',
    scrollbarColor: 'auto',
  });
  document.body.append(probe);
  document.documentElement.toggleAttribute('data-classic-scrollbars', probe.offsetWidth > probe.clientWidth);
  probe.remove();
}
