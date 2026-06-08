import { describe, expect, it } from 'vitest';
import { isMacBlinkUserAgent } from './platform';

describe('isMacBlinkUserAgent', () => {
  it('detects macOS Chromium/Blink and rejects Safari', () => {
    expect(isMacBlinkUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36')).toBe(true);
    expect(isMacBlinkUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15')).toBe(false);
  });
});
