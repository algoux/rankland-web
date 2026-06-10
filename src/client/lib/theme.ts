import { reactive, readonly, type InjectionKey } from 'vue';
import { LocalStorageKey } from '@/app/local-storage-key.config';

export type ThemeName = 'light' | 'dark';
export type ThemeMode = 'auto' | ThemeName;

export interface ThemeService {
  state: Readonly<{ mode: ThemeMode; theme: ThemeName }>;
  setMode(mode: ThemeMode): void;
  setTheme(theme: ThemeName): void;
  mount(win?: Window): () => void;
}

export const THEME_TOKEN: InjectionKey<ThemeService> = Symbol('rankland-theme');

function isThemeName(value: unknown): value is ThemeName {
  return value === 'light' || value === 'dark';
}

function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'auto' || isThemeName(value) ? value : 'auto';
}

function resolveWindow(win?: Window) {
  if (win) {
    return win;
  }
  return typeof window === 'undefined' ? undefined : window;
}

function readStoredThemeMode(win?: Window): ThemeMode {
  const targetWindow = resolveWindow(win);
  try {
    return normalizeThemeMode(targetWindow?.localStorage?.getItem(LocalStorageKey.ThemeMode));
  } catch {
    return 'auto';
  }
}

function writeStoredThemeMode(mode: ThemeMode, win?: Window) {
  const targetWindow = resolveWindow(win);
  try {
    targetWindow?.localStorage?.setItem(LocalStorageKey.ThemeMode, mode);
  } catch {
    // Ignore unavailable or blocked localStorage; the reactive theme still updates.
  }
}

function resolveDomTheme(): ThemeName | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  if (document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  if (document.documentElement.classList.contains('light')) {
    return 'light';
  }
  return undefined;
}

function resolveSystemTheme(win?: Window, media?: MediaQueryList | MediaQueryListEvent): ThemeName {
  if (media) {
    return media.matches ? 'dark' : 'light';
  }
  const targetWindow = resolveWindow(win);
  try {
    return targetWindow?.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyDocumentTheme(theme: ThemeName) {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
}

export function createThemeService(): ThemeService {
  const initialMode = readStoredThemeMode();
  const state = reactive<{ mode: ThemeMode; theme: ThemeName }>({
    mode: initialMode,
    theme: isThemeName(initialMode) ? initialMode : resolveDomTheme() || resolveSystemTheme(),
  });

  const applyTheme = (theme: ThemeName) => {
    state.theme = theme;
    applyDocumentTheme(theme);
  };

  const applyMode = (mode: ThemeMode, win?: Window, media?: MediaQueryList | MediaQueryListEvent) => {
    state.mode = mode;
    applyTheme(isThemeName(mode) ? mode : resolveSystemTheme(win, media));
  };

  const setMode = (mode: ThemeMode) => {
    const normalizedMode = normalizeThemeMode(mode);
    writeStoredThemeMode(normalizedMode);
    applyMode(normalizedMode);
  };

  const setTheme = (theme: ThemeName) => {
    setMode(theme);
  };

  const mount = (win?: Window) => {
    const targetWindow = win ?? (typeof window === 'undefined' ? undefined : window);
    const storedMode = readStoredThemeMode(targetWindow);
    if (!targetWindow?.matchMedia) {
      applyMode(storedMode, targetWindow);
      return () => {};
    }

    const media = targetWindow.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = (event: MediaQueryList | MediaQueryListEvent) => {
      if (state.mode === 'auto') {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };

    applyMode(storedMode, targetWindow, media);
    if (media.addEventListener) {
      media.addEventListener('change', syncTheme);
      return () => media.removeEventListener('change', syncTheme);
    }

    media.addListener(syncTheme);
    return () => media.removeListener(syncTheme);
  };

  return {
    state: readonly(state),
    setMode,
    setTheme,
    mount,
  };
}
