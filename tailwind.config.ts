import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#050505',
          900: '#0b0c0c',
          850: '#101211',
          800: '#171a18',
          700: '#252a27',
        },
        gold: {
          50: '#fffaf0',
          100: '#f9eccb',
          300: '#e7c66f',
          400: '#d8aa36',
          500: '#b98520',
          700: '#765011',
        },
        ivory: {
          50: '#fbfaf6',
          100: '#f5f1e7',
          300: '#d8d1c1',
        },
        sage: {
          300: '#9fb8a7',
          500: '#5e8069',
        },
      },
      boxShadow: {
        glow: '0 14px 40px rgba(216, 170, 54, 0.14)',
        soft: '0 22px 70px rgba(0, 0, 0, 0.34)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Arial Black', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 420ms ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
