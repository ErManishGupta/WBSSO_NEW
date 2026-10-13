/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#FFF8F0',
          100: '#FFF0DB',
          200: '#FEDDB2',
          300: '#FDC485',
          400: '#FBA653',
          500: '#F88523',
          600: '#E9680F',
          700: '#D34D09',
          800: '#B03C0D',
          900: '#8E320F',
          950: '#4D1705',
        },
        navy: {
          700: '#1D3B6C',
          800: '#142749',
          850: '#0F1D35',
          900: '#0B1528',
          950: '#070D18',
        },
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        govNavy: {
          DEFAULT: '#0F2744',
          800: '#132E4F',
          900: '#0A1C33',
          950: '#061324',
        },
        warmCanvas: '#FAF7F2',
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Bengali"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
