import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'wb_sso_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem('wb_sso_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Listen to OS system theme changes if user hasn't explicitly set a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyThemeWithTransition = (applyFn: () => void) => {
    if (typeof document === 'undefined') {
      applyFn();
      return;
    }

    // 1. If native View Transitions API is supported, use it for browser-level smooth crossfade
    const docAny = document as any;
    if (typeof docAny.startViewTransition === 'function') {
      docAny.startViewTransition(() => {
        applyFn();
      });
      return;
    }

    // 2. Coordinated CSS property transition fallback
    const root = document.documentElement;
    root.classList.add('theme-transition');
    applyFn();
    window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 400);
  };

  const toggleTheme = () => {
    applyThemeWithTransition(() => {
      setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    });
  };

  const setTheme = (newTheme: Theme) => {
    if (newTheme === theme) return;
    applyThemeWithTransition(() => {
      setThemeState(newTheme);
    });
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      isDark: theme === 'dark',
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
