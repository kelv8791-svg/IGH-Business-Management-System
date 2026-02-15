/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#f3f6fb',
          card: '#ffffff',
          text: '#0f172a',
          muted: '#5b6b7a',
          gold: '#fbbf24',
          darkGold: '#f59e0b',
          success: '#10b981',
          danger: '#ef4444',
          sidebar: '#111827',
          sidebarLight: '#151923',
        }
      },
      boxShadow: {
        'card': '0 6px 24px rgba(15,23,42,0.08)',
      },
      borderRadius: {
        'card': '12px',
      }
    }
  },
  plugins: []
}
