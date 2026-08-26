import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SessionManager from './SessionManager'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { compactMode } = useAuth()

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1329] ${compactMode ? 'compact' : ''}`}>
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-56' : 'w-[72px]'} transition-all duration-300 flex-shrink-0`}
        style={{ minWidth: sidebarOpen ? '14rem' : '72px' }}
      >
        <Sidebar open={sidebarOpen} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">
          <SessionManager />
          {children}
        </main>
      </div>
    </div>
  )
}
