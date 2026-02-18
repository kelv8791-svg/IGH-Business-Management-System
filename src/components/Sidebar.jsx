import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  BarChart3, Users, Package, FileText, Settings, Menu,
  DollarSign, Layers, Briefcase, ShoppingCart, LayoutDashboard
} from 'lucide-react'

export default function Sidebar({ open }) {
  const location = useLocation()
  const { user } = useAuth()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sales', label: 'Sales', icon: DollarSign },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/design-projects', label: 'Design Projects', icon: Layers },
    { path: '/expenses', label: 'Expenses', icon: ShoppingCart },
    { path: '/suppliers', label: 'Suppliers', icon: Briefcase },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className={`bg-gradient-to-b from-primary-sidebar to-primary-sidebarLight text-primary-gold h-screen overflow-y-auto z-40 flex flex-col`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-col items-center justify-center">
          <img src="/logo.jpg" alt="IGH Logo" className={`rounded-lg mb-2 ${open ? 'h-16' : 'h-12'}`} />
          {open && (
            <>
              <p className="text-xs text-gray-400 text-center leading-tight">Where Creativity</p>
              <p className="text-xs text-gray-400 text-center">Meets Excellence</p>
            </>
          )}
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-primary-gold/20 border-l-4 border-primary-gold text-primary-gold'
                  : 'text-gray-300 hover:text-primary-gold hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              {open && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-gray-700">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            isActive('/settings')
              ? 'bg-primary-gold/20 border-l-4 border-primary-gold text-primary-gold'
              : 'text-gray-300 hover:text-primary-gold hover:bg-gray-800'
          }`}
        >
          <Settings size={20} />
          {open && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>
    </aside>
  )
}
