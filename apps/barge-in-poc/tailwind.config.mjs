/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'pulse-green': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.5)' },
          '50%':     { boxShadow: '0 0 0 12px rgba(16,185,129,0)' },
        },
        'pulse-amber': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.5)' },
          '50%':     { boxShadow: '0 0 0 12px rgba(245,158,11,0)' },
        },
      },
      animation: {
        'pulse-green': 'pulse-green 1.5s infinite',
        'pulse-amber': 'pulse-amber 1.2s infinite',
      },
    },
  },
  plugins: [],
};
