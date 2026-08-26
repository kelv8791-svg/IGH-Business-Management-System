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
        // Logo-aligned Orange, Yellow/Gold, Black & White Palette
        brand: {
          orange: '#f97316',
          orangeDark: '#ea580c',
          orangeLight: '#ffedd5',
          gold: '#f59e0b',
          goldLight: '#fef3c7',
          yellow: '#eab308',
          black: '#0f172a',
          obsidian: '#0b101d',
          charcoal: '#151c2e',
        },
        primary: {
          bg: '#f4f6fa',
          card: '#ffffff',
          text: '#0f172a',
          muted: '#64748b',
          gold: '#f59e0b',
          orange: '#f97316',
          blue: '#2563eb',
          emerald: '#10b981',
          rose: '#f43f5e',
          sidebar: '#0c101d',
          sidebarLight: '#161f36',
        }
      },
      boxShadow: {
        'card':        '0 2px 12px -2px rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        'card-hover':  '0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.03)',
        'card-dark':   '0 4px 20px 0 rgba(0, 0, 0, 0.45)',
        'brand-glow':  '0 0 24px rgba(249, 115, 22, 0.25)',
        'gold-glow':   '0 0 24px rgba(245, 158, 11, 0.25)',
        'blue-glow':   '0 0 24px rgba(37, 99, 235, 0.25)',
        'sidebar':     '4px 0 30px rgba(0, 0, 0, 0.12)',
        'topbar':      '0 1px 0 rgba(15, 23, 42, 0.06)',
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
        'fade-in':   'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':  'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    }
  },
  plugins: []
}
