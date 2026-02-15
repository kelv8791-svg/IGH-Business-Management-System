import { useState, useEffect, createContext, useContext } from 'react'
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
import { DataProvider } from './context/DataContext'

// Auth Context
const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
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

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, darkMode, setDarkMode, compactMode, setCompactMode }}>
      <DataProvider>
        <Router>
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
                      <Route path="/design-projects" element={<DesignProjects />} />
                      <Route path="/expenses" element={<Expenses />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/reports" element={<Reports />} />
                      {user.role === 'admin' && (
                        <Route path="/settings" element={<Settings />} />
                      )}
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </Router>
      </DataProvider>
    </AuthContext.Provider>
  )
}

export default App
