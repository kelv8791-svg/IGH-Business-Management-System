import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { LogOut, Moon, Sun, Maximize2, Minimize2, Menu, ChevronDown, Building2 } from 'lucide-react'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, darkMode, setDarkMode, compactMode, setCompactMode } = useAuth()
  const { selectedBranch, setSelectedBranch } = useData()

  const branchColors = {
    All:   { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-200' },
    IGH:   { bg: 'bg-blue-50 dark:bg-blue-900/30',  text: 'text-blue-700 dark:text-blue-300'  },
    iGift: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300'},
  }
  const bc = branchColors[selectedBranch] || branchColors.All

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
      style={{
        background: darkMode
          ? 'rgba(9,15,30,0.96)'
          : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.09)',
        boxShadow: darkMode ? '0 1px 0 rgba(0,0,0,0.5)' : '0 1px 0 rgba(15,23,42,0.06)',
      }}
    >
      {/* ── Left: hamburger + title ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="topbar-btn flex-shrink-0"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <h2 className="text-sm md:text-base font-extrabold text-slate-800 dark:text-white tracking-tight truncate">
            IGH Business Management
          </h2>
          <span className="hidden lg:block text-xs font-semibold text-amber-500 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 rounded-full px-2 py-0.5">
            System
          </span>
        </div>
      </div>

      {/* ── Right: controls ── */}
      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* Branch Switcher (Admin only) */}
        {user?.role === 'admin' && (
          <div className={`flex items-center gap-1.5 ${bc.bg} px-2.5 py-1.5 rounded-xl transition-colors duration-200`}>
            <Building2 size={14} className={bc.text + ' flex-shrink-0'} />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className={`bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer p-0 pr-4 appearance-none ${bc.text}`}
              style={{ backgroundImage: "none" }}
            >
              <option value="All">All Branches</option>
              <option value="IGH">IGH Branch</option>
              <option value="iGift">iGift Shop</option>
            </select>
            <ChevronDown size={12} className={bc.text} />
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="topbar-btn"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode
            ? <Sun size={18} className="text-amber-400" />
            : <Moon size={18} />
          }
        </button>

        {/* Compact Mode Toggle */}
        <button
          onClick={() => setCompactMode(!compactMode)}
          className="hidden sm:flex topbar-btn"
          title={compactMode ? 'Expand View' : 'Compact View'}
        >
          {compactMode ? <Maximize2 size={17} /> : <Minimize2 size={17} />}
        </button>

        {/* User Pill */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}
          >
            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-right leading-none">
            <p className="text-xs font-bold text-slate-800 dark:text-white capitalize">
              {user?.username || user?.email}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 capitalize mt-0.5">
              {user?.role} · {user?.branch}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn-danger px-3 py-2 text-xs gap-1.5"
          title="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:block font-bold">Logout</span>
        </button>
      </div>
    </header>
  )
}
