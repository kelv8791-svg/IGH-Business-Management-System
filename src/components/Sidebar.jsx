import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  BarChart3, Users, Package, Settings, 
  DollarSign, Layers, Briefcase, ShoppingCart, LayoutDashboard,
  Sparkles
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
      className="h-full overflow-y-auto z-40 flex flex-col text-white flex-shrink-0 select-none"
      style={{
        background: '#111827',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* ── Logo / Branding ── */}
      <div
        className="flex flex-col items-center justify-center py-5 px-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-300 shadow-md ring-2 ring-amber-500/40 ${open ? 'w-14 h-14' : 'w-10 h-10'}`}
          style={{ background: 'white' }}
        >
          <img
            src="/logo.jpg"
            alt="IGH Logo"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        {open && (
          <div className="mt-2.5 text-center">
            <p className="text-xs font-black text-amber-400 uppercase tracking-widest leading-tight">
              IGH · iGIFT
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">
              Where Creativity Meets Excellence
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
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
                className={`flex-shrink-0 transition-colors ${active ? 'text-slate-950' : 'text-slate-400'}`}
              />
              {open && (
                <span className={`truncate ${active ? 'text-slate-950 font-extrabold' : 'text-slate-300 font-medium'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Settings & User Info ── */}
      <div
        className="px-3 pb-4 pt-2"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <Link
          to="/settings"
          onClick={handleNavClick}
          title={!open ? 'Settings' : undefined}
          className={`sidebar-nav-item mb-2 ${isActive('/settings') ? 'active' : ''}`}
        >
          <Settings
            size={18}
            className={`flex-shrink-0 ${isActive('/settings') ? 'text-slate-950' : 'text-slate-400'}`}
          />
          {open && (
            <span className={`truncate ${isActive('/settings') ? 'text-slate-950 font-extrabold' : 'text-slate-300 font-medium'}`}>
              Settings
            </span>
          )}
        </Link>

        {open && (
          <div
            className="flex items-center gap-2.5 p-2 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-amber-400 text-xs font-black flex-shrink-0 shadow-sm border border-amber-500/30"
              style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
            >
              {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-none">
              <p className="text-xs font-bold text-slate-200 truncate capitalize">
                {user?.username || user?.email}
              </p>
              <p className="text-[10px] text-amber-400 font-semibold truncate capitalize mt-1">
                {user?.role} · {user?.branch || 'IGH'}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
