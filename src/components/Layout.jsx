import { useState } from 'react'
import { useAuth } from '../App'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { compactMode } = useAuth()

  return (
    <div className={`flex h-screen bg-primary-bg ${compactMode ? 'compact' : ''}`}>
      {/* Sidebar - Takes space in flex, doesn't overlap */}
      <div className={`${sidebarOpen ? 'w-56' : 'w-20'} transition-all duration-300 flex-shrink-0`}>
        <Sidebar open={sidebarOpen} />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-auto bg-primary-bg p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
