import { afterEach, describe, expect, it, vi } from 'vitest';
import { installRanklandAnalytics } from './analytics';

describe('installRanklandAnalytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends an initial pageview and route-change pageviews without focus params', () => {
    vi.stubEnv('GTAG', 'G-TEST');
    const afterEach = vi.fn();
    const gtag = vi.fn();
    const win = {
      gtag,
      location: {
        protocol: 'https:',
        host: 'xn--fiqs8s.example',
      },
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      },
    };

    installRanklandAnalytics({
      afterEach,
      currentRoute: {
        value: {
          path: '/ranklist/abc',
          query: { focus: 'yes', kw: 'hello world' },
        },
      },
    } as any, win as unknown as Window);

    expect(gtag).toHaveBeenCalledWith('config', 'G-TEST', {
      page_path: '/ranklist/abc?kw=hello%20world',
      page_location: 'https://中国.example/ranklist/abc?kw=hello%20world',
    });

    const routeHandler = afterEach.mock.calls[0][0];
    routeHandler({ path: '/search', query: { kw: 'foo' } });

    expect(gtag).toHaveBeenLastCalledWith('config', 'G-TEST', {
      page_path: '/search?kw=foo',
      page_location: 'https://中国.example/search?kw=foo',
    });
  });

  it('creates a gtag shim and injects the Google tag script when missing', () => {
    vi.stubEnv('GTAG', 'G-TEST');
    const script = {} as HTMLScriptElement;
    const win = {
      dataLayer: [] as unknown[][],
      location: {
        protocol: 'https:',
        host: 'rl.algoux.org',
      },
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      },
      document: {
        createElement: vi.fn(() => script),
        head: {
          appendChild: vi.fn(),
        },
      },
    };

    installRanklandAnalytics({
      afterEach: vi.fn(),
      currentRoute: {
        value: {
          path: '/',
          query: {},
        },
      },
    } as any, win as unknown as Window);

    expect(typeof (win as any).gtag).toBe('function');
    expect(Array.isArray(win.dataLayer[0])).toBe(false);
    expect(Array.from(win.dataLayer[0])[0]).toBe('js');
    expect(win.dataLayer.map((item) => Array.from(item))).toContainEqual(['config', 'G-TEST', {
      page_path: '/',
      page_location: 'https://rl.algoux.org/',
    }]);
    expect(script.async).toBe(true);
    expect(script.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST');
    expect(win.document.head.appendChild).toHaveBeenCalledWith(script);
  });

  it('does not install duplicate pageview hooks on the same window', () => {
    vi.stubEnv('GTAG', 'G-TEST');
    const afterEach = vi.fn();
    const gtag = vi.fn();
    const win = {
      gtag,
      location: {
        protocol: 'https:',
        host: 'rl.algoux.org',
      },
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      },
    };
    const router = {
      afterEach,
      currentRoute: {
        value: {
          path: '/',
          query: {},
        },
      },
    } as any;

    installRanklandAnalytics(router, win as unknown as Window);
    installRanklandAnalytics(router, win as unknown as Window);

    expect(afterEach).toHaveBeenCalledTimes(1);
    expect(gtag.mock.calls.filter(([command]) => command === 'config')).toHaveLength(1);
  });
});
