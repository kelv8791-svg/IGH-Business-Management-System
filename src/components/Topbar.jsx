import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { LogOut, Moon, Sun, Maximize2, Minimize2, Menu, ChevronDown, Building2 } from 'lucide-react'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, darkMode, setDarkMode, compactMode, setCompactMode } = useAuth()
  const { selectedBranch, setSelectedBranch } = useData()

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E3E8EF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* ── Left: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ color: '#69778A', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#182A42' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#69778A' }}
          title="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-xs sm:text-sm font-semibold truncate"
            style={{ color: '#182A42' }}
          >
            IGH Business Management
          </span>
          <span className="text-xs" style={{ color: '#8B97A6' }}>/</span>
          <span
            className="inline-flex text-[11px] font-semibold rounded-md px-2 py-0.5"
            style={{
              color: '#526E99',
              background: '#EEF3FA',
            }}
          >
            {user?.role === 'admin' ? (selectedBranch === 'All' ? 'All Branches' : selectedBranch) : (user?.branch || 'IGH')}
          </span>
        </div>
      </div>

      {/* ── Right: controls ── */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Branch Switcher (Admin only) */}
        {user?.role === 'admin' && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: '#F8FAFC',
              border: '1px solid #E3E8EF',
              color: '#182A42',
            }}
          >
            <Building2 size={13} className="flex-shrink-0" style={{ color: 'var(--igh-orange)' }} />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer p-0 pr-2 appearance-none"
              style={{ backgroundImage: 'none', color: '#182A42' }}
            >
              <option value="All"   className="bg-white text-[#182A42]">All Branches</option>
              <option value="IGH"   className="bg-white text-[#182A42]">IGH Branch</option>
              <option value="iGift" className="bg-white text-[#182A42]">iGift Shop</option>
            </select>
            <ChevronDown size={11} style={{ color: '#8B97A6' }} />
          </div>
        )}

        {/* Compact Mode Toggle */}
        <button
          onClick={() => setCompactMode(!compactMode)}
          className="hidden sm:flex p-2 rounded-lg text-[#69778A] hover:text-[#182A42] hover:bg-[#F1F5F9] transition-all"
          title={compactMode ? 'Expand View' : 'Compact View'}
        >
          {compactMode ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
        </button>

        {/* User Pill */}
        <div
          className="hidden md:flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full"
          style={{
            background: '#F8FAFC',
            border: '1px solid #E3E8EF',
          }}
        >
          {/* Avatar (Figma style dark navy badge or brand orange) */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{
              background: '#14243B',
              color: '#FFFFFF',
            }}
          >
            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-semibold capitalize" style={{ color: '#182A42' }}>
              {user?.username || user?.email}
            </p>
            <p className="text-[10px] font-medium capitalize" style={{ color: '#69778A' }}>
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            color: '#DC2626',
          }}
          title="Logout"
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEE2E2'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FEF2F2'
          }}
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
