import { reactive, readonly, type InjectionKey } from 'vue';

export type ThemeName = 'light' | 'dark';

export interface ThemeService {
  state: Readonly<{ theme: ThemeName }>;
  setTheme(theme: ThemeName): void;
  mount(win?: Window): () => void;
}

export const THEME_TOKEN: InjectionKey<ThemeService> = Symbol('rankland-theme');

export function createThemeService(): ThemeService {
  const state = reactive<{ theme: ThemeName }>({
    theme: 'light',
  });

  const setTheme = (theme: ThemeName) => {
    state.theme = theme;
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  };

  const mount = (win?: Window) => {
    const targetWindow = win ?? (typeof window === 'undefined' ? undefined : window);
    if (!targetWindow?.matchMedia) {
      return () => {};
    }

    const media = targetWindow.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = (event: MediaQueryList | MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    syncTheme(media);
    if (media.addEventListener) {
      media.addEventListener('change', syncTheme);
      return () => media.removeEventListener('change', syncTheme);
    }

    media.addListener(syncTheme);
    return () => media.removeListener(syncTheme);
  };

  return {
    state: readonly(state),
    setTheme,
    mount,
  };
}
