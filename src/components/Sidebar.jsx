import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  BarChart3, Users, Package, Settings,
  DollarSign, Layers, Briefcase, ShoppingCart, LayoutDashboard,
} from 'lucide-react'

export default function Sidebar({ open, onCloseMobile }) {
  const location = useLocation()
  const { user } = useAuth()
  const { selectedBranch } = useData()

  const navItems = [
    { path: '/',                label: 'Dashboard',       icon: LayoutDashboard },
    { path: '/sales',           label: 'Sales',           icon: DollarSign      },
    { path: '/clients',         label: 'Clients',         icon: Users           },
    { path: '/design-projects', label: 'Design Projects', icon: Layers          },
    { path: '/expenses',        label: 'Expenses',        icon: ShoppingCart    },
    { path: '/suppliers',       label: 'Suppliers',       icon: Briefcase       },
    { path: '/inventory',       label: 'Inventory',       icon: Package         },
    { path: '/reports',         label: 'Reports',         icon: BarChart3       },
  ].filter(item => {
    if (user?.role === 'admin') return true
    const branch = user?.branch || 'IGH'
    if (item.path === '/inventory'       && branch === 'IGH')   return false
    if (item.path === '/design-projects' && branch === 'iGift') return false
    return true
  })

  const isActive = (path) => location.pathname === path

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <aside
      className="h-full overflow-y-auto z-40 flex flex-col flex-shrink-0 select-none"
      style={{
        background: 'var(--igh-surface-0)',
        borderRight: '1px solid var(--igh-border)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Logo / Branding ── */}
      <div
        className="flex flex-col items-center justify-center py-5 px-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        {/* Logo lockup */}
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-300 shadow-lg ${open ? 'w-14 h-14' : 'w-10 h-10'}`}
          style={{
            background: '#0d0d0d',
            border: '2px solid rgba(249,115,22,0.40)',
            boxShadow: '0 0 16px rgba(249,115,22,0.25)',
          }}
        >
          <img
            src="/logo.jpg"
            alt="IGH Logo"
            className="w-full h-full object-contain p-0.5"
          />
        </div>

        {open && (
          <div className="mt-3 text-center">
            <p
              className="text-xs font-black uppercase tracking-widest leading-tight"
              style={{ color: 'var(--igh-orange)' }}
            >
              IGH · iGIFT
            </p>
            <p className="text-[10px] font-medium mt-0.5 leading-tight" style={{ color: '#8B97A6' }}>
              Where Creativity Meets Excellence
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={!open ? item.label : undefined}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
            >
              <Icon
                size={18}
                className="flex-shrink-0"
                style={{ color: active ? '#fff' : '#8B97A6' }}
              />
              {open && (
                <span
                  className="truncate text-xs sm:text-sm"
                  style={{ color: active ? '#fff' : '#CBD5E1', fontWeight: active ? 700 : 500 }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Settings & User Info ── */}
      <div
        className="px-2.5 pb-4 pt-2"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        <Link
          to="/settings"
          onClick={handleNavClick}
          title={!open ? 'Settings' : undefined}
          className={`sidebar-nav-item mb-2 ${isActive('/settings') ? 'active' : ''}`}
        >
          <Settings
            size={18}
            className="flex-shrink-0"
            style={{ color: isActive('/settings') ? '#fff' : '#8B97A6' }}
          />
          {open && (
            <span
              className="truncate text-xs sm:text-sm"
              style={{ color: isActive('/settings') ? '#fff' : '#CBD5E1', fontWeight: isActive('/settings') ? 700 : 500 }}
            >
              Settings
            </span>
          )}
        </Link>

        {open && (
          <div
            className="flex items-center gap-2.5 p-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #F97316, #ea6b0a)',
                color: '#ffffff',
                boxShadow: '0 0 12px rgba(249,115,22,0.35)',
              }}
            >
              {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-none">
              <p className="text-xs font-bold truncate capitalize" style={{ color: '#FFFFFF' }}>
                {user?.username || user?.email}
              </p>
              <p className="text-[10px] font-semibold truncate capitalize mt-1" style={{ color: 'var(--igh-orange)' }}>
                {user?.role} · {user?.branch || 'IGH'}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
