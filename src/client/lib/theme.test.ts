import { afterEach, describe, expect, it, vi } from 'vitest';
import { createThemeService } from './theme';

describe('createThemeService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates reactive state without requiring a browser document', () => {
    const theme = createThemeService();

    theme.setTheme('dark');

    expect(theme.state.theme).toBe('dark');
  });

  it('mounts as a no-op without a browser window', () => {
    const theme = createThemeService();

    const cleanup = theme.mount();

    expect(theme.state.theme).toBe('light');
    expect(cleanup).not.toThrow();
  });

  it('syncs the html class from system dark mode and cleans up the listener', () => {
    const classes = new Set<string>();
    const style: Record<string, string> = {};
    const documentElement = {
      classList: {
        add: (name: string) => classes.add(name),
        remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      },
      style,
    };
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const media = {
      matches: true,
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
      matchMedia: vi.fn(() => media),
    };

    vi.stubGlobal('document', { documentElement });

    const theme = createThemeService();
    const cleanup = theme.mount(win as unknown as Window);

    expect(theme.state.theme).toBe('dark');
    expect(classes.has('dark')).toBe(true);
    expect(style.colorScheme).toBe('dark');

    listener?.({ matches: false });
    expect(theme.state.theme).toBe('light');
    expect(classes.has('dark')).toBe(false);
    expect(classes.has('light')).toBe(true);

    cleanup();
    expect(media.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
