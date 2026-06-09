export function isMacBlinkUserAgent(userAgent: string) {
  return /Macintosh|Mac OS X/.test(userAgent) && /(Chrome|Chromium|Edg)\//.test(userAgent);
}

export function applyMacBlinkOptimizations(win: Window = window) {
  if (isMacBlinkUserAgent(win.navigator.userAgent)) {
    win.document.body.classList.add('optimize-decrease-effects');
  }
}
