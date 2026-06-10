import { afterEach, describe, expect, it, vi } from 'vitest';
import { createThemeService } from './theme';
import { LocalStorageKey } from '@/app/local-storage-key.config';

function stubThemeDom(initialClasses: string[] = []) {
  const classes = new Set<string>(initialClasses);
  const style: Record<string, string> = {};
  const documentElement = {
    classList: {
      add: (name: string) => classes.add(name),
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      contains: (name: string) => classes.has(name),
    },
    style,
  };

  vi.stubGlobal('document', { documentElement });
  return { classes, style };
}

function stubThemeWindow(options: { systemDark: boolean; storedMode?: string }) {
  const store = new Map<string, string>();
  if (options.storedMode !== undefined) {
    store.set(LocalStorageKey.ThemeMode, options.storedMode);
  }
  let listener: ((event: { matches: boolean }) => void) | undefined;
  const media = {
    matches: options.systemDark,
    addEventListener: vi.fn((_event: string, cb: typeof listener) => {
      listener = cb;
    }),
    removeEventListener: vi.fn((_event: string, cb: typeof listener) => {
      if (listener === cb) {
        listener = undefined;
      }
    }),
  };
  const win = {
    localStorage: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
    },
    matchMedia: vi.fn(() => media),
  };

  vi.stubGlobal('window', win);
  return {
    media,
    store,
    win,
    dispatchSystemTheme(systemDark: boolean) {
      media.matches = systemDark;
      listener?.({ matches: systemDark });
    },
  };
}

describe('createThemeService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates reactive state without requiring a browser document', () => {
    const theme = createThemeService();

    theme.setTheme('dark');

    expect(theme.state.theme).toBe('dark');
    expect(theme.state.mode).toBe('dark');
  });

  it('mounts as a no-op without a browser window', () => {
    const theme = createThemeService();

    const cleanup = theme.mount();

    expect(theme.state.theme).toBe('light');
    expect(theme.state.mode).toBe('auto');
    expect(cleanup).not.toThrow();
  });

  it('syncs the html class from system dark mode and cleans up the listener', () => {
    const { classes, style } = stubThemeDom();
    const { dispatchSystemTheme, media, win } = stubThemeWindow({ systemDark: true });

    const theme = createThemeService();
    const cleanup = theme.mount(win as unknown as Window);

    expect(theme.state.mode).toBe('auto');
    expect(theme.state.theme).toBe('dark');
    expect(classes.has('dark')).toBe(true);
    expect(style.colorScheme).toBe('dark');

    dispatchSystemTheme(false);
    expect(theme.state.theme).toBe('light');
    expect(classes.has('dark')).toBe(false);
    expect(classes.has('light')).toBe(true);

    cleanup();
    expect(media.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('locks dark and light modes in localStorage and ignores system changes', () => {
    const { classes, style } = stubThemeDom();
    const { dispatchSystemTheme, store, win } = stubThemeWindow({ systemDark: false });

    const theme = createThemeService();
    theme.mount(win as unknown as Window);

    theme.setMode('dark');

    expect(theme.state.mode).toBe('dark');
    expect(theme.state.theme).toBe('dark');
    expect(store.get(LocalStorageKey.ThemeMode)).toBe('dark');
    expect(classes.has('dark')).toBe(true);
    expect(style.colorScheme).toBe('dark');

    dispatchSystemTheme(false);
    expect(theme.state.theme).toBe('dark');

    theme.setMode('light');

    expect(theme.state.mode).toBe('light');
    expect(theme.state.theme).toBe('light');
    expect(store.get(LocalStorageKey.ThemeMode)).toBe('light');
    expect(classes.has('light')).toBe(true);
    expect(classes.has('dark')).toBe(false);
    expect(style.colorScheme).toBe('light');

    dispatchSystemTheme(true);
    expect(theme.state.theme).toBe('light');
  });

  it('persists auto mode and resumes system theme syncing', () => {
    const { classes } = stubThemeDom();
    const { dispatchSystemTheme, store, win } = stubThemeWindow({ systemDark: false, storedMode: 'dark' });

    const theme = createThemeService();
    theme.mount(win as unknown as Window);

    expect(theme.state.mode).toBe('dark');
    expect(theme.state.theme).toBe('dark');

    theme.setMode('auto');

    expect(theme.state.mode).toBe('auto');
    expect(theme.state.theme).toBe('light');
    expect(store.get(LocalStorageKey.ThemeMode)).toBe('auto');
    expect(classes.has('light')).toBe(true);

    dispatchSystemTheme(true);
    expect(theme.state.theme).toBe('dark');
    expect(classes.has('dark')).toBe(true);
  });

  it('falls back to auto mode for invalid localStorage values', () => {
    stubThemeDom();
    const { win } = stubThemeWindow({ systemDark: true, storedMode: 'sepia' });

    const theme = createThemeService();
    theme.mount(win as unknown as Window);

    expect(theme.state.mode).toBe('auto');
    expect(theme.state.theme).toBe('dark');
  });
});
