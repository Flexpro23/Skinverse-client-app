/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'midnight-blue': '#192A51',
        'light-grey': '#F8F9FA',
        'bronze': '#C5A475',
        'clinical-green': '#2E7D32',
        'alert-red': '#C62828',
        'medium-grey': '#6C757D',
        'light-border-grey': '#DEE2E6',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'button': ['18px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      boxShadow: {
        'button': '0 4px 6px rgba(0,0,0,0.1)',
        'button-hover': '0 6px 8px rgba(0,0,0,0.15)',
        'focus': '0 0 0 3px rgba(197, 164, 117, 0.2)',
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}