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
        // Executive White, Warm Gold/Amber & Charcoal Slate Palette
        brand: {
          gold: '#f59e0b',
          goldHover: '#d97706',
          goldLight: '#fef3c7',
          yellow: '#eab308',
          charcoal: '#111827',
          obsidian: '#0b101d',
          graphite: '#1e293b',
          muted: '#64748b',
        },
        primary: {
          bg: '#f8fafc',
          card: '#ffffff',
          text: '#0f172a',
          muted: '#64748b',
          gold: '#f59e0b',
          blue: '#2563eb',
          emerald: '#10b981',
          rose: '#f43f5e',
          sidebar: '#111827',
          sidebarLight: '#1f2937',
        }
      },
      boxShadow: {
        'card':        '0 2px 8px -1px rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        'card-hover':  '0 12px 28px -4px rgba(245, 158, 11, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
        'card-dark':   '0 4px 20px 0 rgba(0, 0, 0, 0.45)',
        'gold-glow':   '0 4px 20px -2px rgba(245, 158, 11, 0.35)',
        'sidebar':     '4px 0 24px rgba(0, 0, 0, 0.18)',
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
