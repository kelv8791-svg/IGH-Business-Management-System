import { useAuth } from '../App'
import { LogOut, Moon, Sun, Maximize2, Minimize2 } from 'lucide-react'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, darkMode, setDarkMode, compactMode, setCompactMode } = useAuth()

  return (
    <div className={`sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-md h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700`}>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">IGH Business Management System</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Compact Mode Toggle */}
        <button
          onClick={() => setCompactMode(!compactMode)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={compactMode ? 'Expand' : 'Compact'}
        >
          {compactMode ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.username || user?.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-gold flex items-center justify-center text-white text-sm font-bold">
            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn-danger flex items-center gap-2 whitespace-nowrap"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )
}
