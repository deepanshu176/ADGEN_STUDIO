/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#21808d',
        secondary: '#5e5240',
        accent: '#e67e4e',
      },
      spacing: {
        'safe': 'max(16px, env(safe-area-inset-left))',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(33, 128, 141, 0.3)',
        'inner-glow': 'inset 0 0 10px rgba(33, 128, 141, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(33, 128, 141, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(33, 128, 141, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
