import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { LogOut, Moon, Sun, Maximize2, Minimize2, Menu, ChevronDown, Building2 } from 'lucide-react'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, darkMode, setDarkMode, compactMode, setCompactMode } = useAuth()
  const { selectedBranch, setSelectedBranch } = useData()

  const branchColors = {
    All:   { bg: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700' },
    IGH:   { bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/50'  },
    iGift: { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/50'},
  }
  const bc = branchColors[selectedBranch] || branchColors.All

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors">
      {/* ── Left: hamburger + title ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="topbar-btn flex-shrink-0"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            IGH Business Management
          </h2>
          <span className="hidden sm:inline-flex text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/50 rounded-full px-2.5 py-0.5">
            System
          </span>
        </div>
      </div>

      {/* ── Right: controls ── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">

        {/* Branch Switcher (Admin only) */}
        {user?.role === 'admin' && (
          <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${bc.bg}`}>
            <Building2 size={13} className="flex-shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer p-0 pr-2 sm:pr-3 appearance-none text-inherit"
              style={{ backgroundImage: "none" }}
            >
              <option value="All" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">All Branches</option>
              <option value="IGH" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">IGH Branch</option>
              <option value="iGift" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">iGift Shop</option>
            </select>
            <ChevronDown size={11} className="opacity-70" />
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
            : <Moon size={18} className="text-slate-600" />
          }
        </button>

        {/* Compact Mode Toggle */}
        <button
          onClick={() => setCompactMode(!compactMode)}
          className="hidden sm:flex topbar-btn"
          title={compactMode ? 'Expand View' : 'Compact View'}
        >
          {compactMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </button>

        {/* User Pill */}
        <div className="hidden md:flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-amber-400 text-[11px] font-black flex-shrink-0 border border-amber-500/30"
            style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
          >
            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
              {user?.username || user?.email}
            </p>
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 capitalize">
              {user?.role} · {user?.branch || 'IGH'}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn-danger px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl gap-1.5"
          title="Logout"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
