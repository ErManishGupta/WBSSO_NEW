import { create } from 'zustand';
import i18n from '../i18n';

export type ThemeMode = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
  language: 'en' | 'bn';
  contrastMode: 'normal' | 'high';
  textSize: 'normal' | 'large' | 'xlarge';
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (lang: 'en' | 'bn') => void;
  toggleContrast: () => void;
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('wb_sso_theme');
  if (saved === 'dark' || saved === 'light') {
    if (saved === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return saved;
  }
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
    return 'dark';
  }
  document.documentElement.classList.remove('dark');
  return 'light';
};

const initialTheme = getInitialTheme();

export const useUiStore = create<UiState>((set) => ({
  theme: initialTheme,
  language: 'en',
  contrastMode: 'normal',
  textSize: 'normal',

  toggleTheme: () => {
    set((state) => {
      const next: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('wb_sso_theme', next);
      } catch {
        // ignore
      }
      return { theme: next };
    });
  },

  setTheme: (theme: ThemeMode) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('wb_sso_theme', theme);
    } catch {
      // ignore
    }
    set({ theme });
  },

  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    set({ language: lang });
  },

  toggleContrast: () => {
    set((state) => {
      const next = state.contrastMode === 'normal' ? 'high' : 'normal';
      if (next === 'high') {
        document.documentElement.setAttribute('data-contrast', 'high');
      } else {
        document.documentElement.removeAttribute('data-contrast');
      }
      return { contrastMode: next };
    });
  },

  setTextSize: (size) => {
    if (size === 'normal') {
      document.documentElement.removeAttribute('data-text-size');
    } else {
      document.documentElement.setAttribute('data-text-size', size);
    }
    set({ textSize: size });
  },
}));
