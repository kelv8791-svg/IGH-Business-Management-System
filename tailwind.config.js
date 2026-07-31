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
          bg: '#f8fafc',
          card: '#ffffff',
          text: '#0f172a',
          muted: '#64748b',
          gold: '#f59e0b',
          amberGold: '#d97706',
          darkGold: '#b45309',
          lightGold: '#fef3c7',
          success: '#10b981',
          danger: '#ef4444',
          sidebar: '#0f172a',
          sidebarLight: '#1e293b',
        },
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      boxShadow: {
        'card':        '0 1px 4px 0 rgba(15,23,42,0.07), 0 4px 20px -2px rgba(15,23,42,0.07)',
        'card-dark':   '0 1px 4px 0 rgba(0,0,0,0.4),  0 4px 24px -4px rgba(0,0,0,0.55)',
        'gold-glow':   '0 0 24px rgba(245,158,11,0.30)',
        'gold-ring':   '0 0 0 3px rgba(245,158,11,0.20)',
        'sidebar':     '4px 0 24px rgba(0,0,0,0.18)',
        'topbar':      '0 1px 0 rgba(15,23,42,0.08)',
        'topbar-dark': '0 1px 0 rgba(0,0,0,0.40)',
      },
      borderRadius: {
        'card': '14px',
        '2xl':  '1rem',
        '3xl':  '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #0d1627 0%, #0f172a 40%, #1a0a2e 100%)',
        'gold-gradient':    'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        'hero-gradient':    'linear-gradient(135deg, #0f172a 0%, #1e1040 50%, #0f172a 100%)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.3)' }, '50%': { boxShadow: '0 0 0 8px rgba(245,158,11,0)' } },
      }
    }
  },
  plugins: []
}
