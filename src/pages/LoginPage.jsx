import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { useData } from '../context/DataContext'

export default function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { data } = useData()

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    const user = data.users.find(u => u.username === username && u.password === password)
    if (user) {
      login({ username: user.username, role: user.role })
      navigate('/')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-sidebar to-primary-sidebarLight">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.jpg" alt="IGH Logo" className="h-32 w-auto rounded-lg" />
          </div>
          <p className="text-center text-gray-600 font-semibold mb-2">Where Creativity Meets Excellence</p>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">IGH Business Management System</h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="form-input"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3 font-semibold">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>User:</strong> user / user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
