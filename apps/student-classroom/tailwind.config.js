/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'ring-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.6)' },
          '50%':     { boxShadow: '0 0 0 12px rgba(245,158,11,0)' },
        },
        'bounce-soft': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'ring-pulse': 'ring-pulse 1.5s infinite',
        'bounce-soft': 'bounce-soft 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
