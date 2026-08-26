import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Clients from './pages/Clients'
import DesignProjects from './pages/DesignProjects'
import Expenses from './pages/Expenses'
import Suppliers from './pages/Suppliers'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { DataProvider, useData } from './context/DataContext'
import AuthContext, { useAuth } from './context/AuthContext'
import supabase from './lib/supabaseClient'

function AppRoutes() {
  const { user } = useAuth()
  const { selectedBranch } = useData()
  const activeBranch = user?.role === 'admin' ? selectedBranch : user?.branch

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          user ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/clients" element={<Clients />} />
                <Route 
                  path="/design-projects" 
                  element={
                    (user?.role === 'admin' || activeBranch === 'IGH') 
                    ? <DesignProjects /> 
                    : <Navigate to="/" />
                  } 
                />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route 
                  path="/inventory" 
                  element={
                    (user?.role === 'admin' || activeBranch === 'iGift') 
                    ? <Inventory /> 
                    : <Navigate to="/" />
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    (user?.role === 'admin' || activeBranch === 'iGift' || activeBranch === 'IGH')
                    ? <Reports /> 
                    : <Navigate to="/" />
                  } 
                />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('compactMode') === 'true'
  })

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('compactMode', compactMode)
  }, [compactMode])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('currentUser', JSON.stringify(userData))
  }

  const logout = async () => {
    if (user?.username) {
      try {
        await supabase.from('users').update({ session_token: null }).eq('username', user.username)
      } catch (err) {
        console.error('Failed to clear session_token on logout:', err)
      }
    }
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, setUser, login, logout, darkMode, setDarkMode, compactMode, setCompactMode }}>
        <DataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </DataProvider>
      </AuthContext.Provider>
    </ErrorBoundary>
  )
}

export default App
