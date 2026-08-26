import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SessionManager from './SessionManager'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  })
  const [isMobile, setIsMobile] = useState(false)
  const { compactMode } = useAuth()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b101d] ${compactMode ? 'compact' : ''}`}>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      {isMobile ? (
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out shadow-2xl ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar open={true} onCloseMobile={() => setSidebarOpen(false)} />
        </div>
      ) : (
        <div
          className={`${sidebarOpen ? 'w-56' : 'w-[72px]'} transition-all duration-300 flex-shrink-0`}
          style={{ minWidth: sidebarOpen ? '14rem' : '72px' }}
        >
          <Sidebar open={sidebarOpen} />
        </div>
      )}

      {/* Main content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 animate-fade-in">
          <SessionManager />
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
