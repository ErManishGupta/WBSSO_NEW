/**
 * Design Tokens for West Bengal Labour Department Unified Portal
 * Formal, accessible government design system aligning with GIGW 3.0 & WCAG 2.1 AA
 */
export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#14306B', // Navy
      600: '#1D4A9B',     // Active / Hover Navy
      700: '#0E2452',
      900: '#081735',
    },
    accent: {
      DEFAULT: '#F28C28', // Saffron highlight (used sparingly)
      light: '#FFF4E6',
      dark: '#C86B15',
    },
    success: {
      DEFAULT: '#138A36', // Green (Active status)
      light: '#E8F5E9',
      dark: '#0E6627',
    },
    danger: {
      DEFAULT: '#C62828', // Error / Suspended
      light: '#FFEBEE',
    },
    warning: {
      DEFAULT: '#B54708', // Action required / Pending
      light: '#FFFAEB',
    },
    surface: '#FFFFFF',
    canvas: '#F4F6FA',
    border: '#D9DFEA',
    borderDark: '#B9C5DB',
    text: {
      DEFAULT: '#101828',
      muted: '#475467',
      inverse: '#FFFFFF',
    },
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    card: '0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.03)',
    cardHover: '0 4px 12px rgba(20, 48, 107, 0.08), 0 2px 4px rgba(20, 48, 107, 0.04)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
} as const;
