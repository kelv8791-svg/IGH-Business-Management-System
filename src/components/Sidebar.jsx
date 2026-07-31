import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  BarChart3, Users, Package, Settings, 
  DollarSign, Layers, Briefcase, ShoppingCart, LayoutDashboard,
  Sparkles
} from 'lucide-react'

export default function Sidebar({ open }) {
  const location = useLocation()
  const { user } = useAuth()
  const { selectedBranch } = useData()

  const navItems = [
    { path: '/',                label: 'Dashboard',       icon: LayoutDashboard, color: 'text-sky-400'    },
    { path: '/sales',           label: 'Sales',           icon: DollarSign,      color: 'text-emerald-400' },
    { path: '/clients',         label: 'Clients',         icon: Users,           color: 'text-blue-400'   },
    { path: '/design-projects', label: 'Design Projects', icon: Layers,          color: 'text-purple-400' },
    { path: '/expenses',        label: 'Expenses',        icon: ShoppingCart,    color: 'text-rose-400'   },
    { path: '/suppliers',       label: 'Suppliers',       icon: Briefcase,       color: 'text-amber-400'  },
    { path: '/inventory',       label: 'Inventory',       icon: Package,         color: 'text-orange-400' },
    { path: '/reports',         label: 'Reports',         icon: BarChart3,       color: 'text-indigo-400' },
  ].filter(item => {
    if (user?.role === 'admin') return true
    const branch = user?.branch || 'IGH'
    if (item.path === '/inventory'       && branch === 'IGH')   return false
    if (item.path === '/design-projects' && branch === 'iGift') return false
    return true
  })

  const isActive = (path) => location.pathname === path

  return (
    <aside
      className="h-screen overflow-y-auto z-40 flex flex-col text-white flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0d1627 0%, #0f172a 50%, #140c2e 100%)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.35)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Logo / Branding ── */}
      <div
        className="flex flex-col items-center justify-center py-5 px-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-300 shadow-gold-glow ring-1 ring-amber-500/20 ${open ? 'w-16 h-16' : 'w-11 h-11'}`}
          style={{ background: 'white' }}
        >
          <img
            src="/logo.jpg"
            alt="IGH Logo"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        {open && (
          <div className="mt-3 text-center">
            <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest leading-none">
              IGH · iGift
            </p>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">
              Where Creativity<br />Meets Excellence
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              title={!open ? item.label : undefined}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 transition-colors ${active ? 'text-amber-300' : item.color} opacity-${active ? '100' : '75'}`}
              />
              {open && (
                <span className={`text-sm font-semibold truncate transition-colors ${active ? 'text-amber-300' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Settings ── */}
      <div
        className="px-2.5 pb-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="pt-3">
          <Link
            to="/settings"
            title={!open ? 'Settings' : undefined}
            className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <Settings
              size={20}
              className={`flex-shrink-0 ${isActive('/settings') ? 'text-amber-300' : 'text-slate-500'}`}
            />
            {open && (
              <span className={`text-sm font-semibold truncate ${isActive('/settings') ? 'text-amber-300' : 'text-slate-400'}`}>
                Settings
              </span>
            )}
          </Link>
        </div>
        {open && (
          <div className="mt-3 mx-2 p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-amber-400 flex-shrink-0" />
              <p className="text-[10px] text-amber-400/70 font-semibold leading-tight">
                {user?.username} · {user?.role}
              </p>
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5 pl-4">{user?.branch}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
