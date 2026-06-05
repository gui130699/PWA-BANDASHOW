import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#05060a',
          900: '#090b12',
          850: '#0d111c',
          800: '#121725',
          700: '#1d2536',
        },
        gold: {
          50: '#fff8e1',
          100: '#ffedb2',
          300: '#ffd166',
          400: '#f7b731',
          500: '#d9991d',
          700: '#8f5c00',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(247, 183, 49, 0.12)',
        soft: '0 22px 70px rgba(0, 0, 0, 0.28)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
