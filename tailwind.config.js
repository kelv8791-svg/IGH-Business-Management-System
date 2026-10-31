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
        // IGH Brand: Metallic Black · Orange · White
        brand: {
          orange:      '#F97316',
          orangeDark:  '#ea6b0a',
          orangeLight: '#fed7aa',
          orangeGlow:  'rgba(249,115,22,0.22)',
          black:       '#0d0d0d',
          charcoal:    '#1a1a1a',
          steel:       '#242424',
          iron:        '#2e2e2e',
          silver:      '#a0a0a0',
          white:       '#ffffff',
        },
        primary: {
          bg:      '#F8FAFC',
          card:    '#FFFFFF',
          panel:   '#FFFFFF',
          text:    '#0F172A',
          muted:   '#334155',
          accent:  '#F97316',
          gold:    '#F97316',
          sidebar: '#14243B',
        }
      },
      boxShadow: {
        'card':        '0 2px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)',
        'card-hover':  '0 8px 28px rgba(249,115,22,0.18), 0 4px 10px rgba(0,0,0,0.3)',
        'card-dark':   '0 4px 20px 0 rgba(0,0,0,0.6)',
        'orange-glow': '0 4px 20px -2px rgba(249,115,22,0.40)',
        'sidebar':     '4px 0 24px rgba(0,0,0,0.4)',
        'topbar':      '0 1px 0 rgba(255,255,255,0.06)',
        'modal':       '0 25px 60px rgba(0,0,0,0.7)',
      },
      borderRadius: {
        'card': '1rem',
        '2xl':  '1rem',
        '3xl':  '1.5rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                                    to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' },      to: { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { from: { opacity: '0', transform: 'translateX(16px)' },     to: { opacity: '1', transform: 'translateX(0)' } },
      }
    }
  },
  plugins: []
}
