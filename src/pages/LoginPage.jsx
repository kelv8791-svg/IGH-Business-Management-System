import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { useData } from '../context/DataContext'
import Modal from '../components/Modal'
import { Lock, Key, User, Save } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  // Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [changePassData, setChangePassData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changePassError, setChangePassError] = useState('')
  const [changePassSuccess, setChangePassSuccess] = useState('')

  const navigate = useNavigate()
  const { login } = useAuth()
  const { data, updateUser } = useData()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    const user = data.users.find(u => u.username === username.toLowerCase() && u.password === password)
    if (user) {
      // Generate unique session token
      const sessionToken = Date.now().toString(36) + Math.random().toString(36).substr(2)
      
      // Update user in DB with new token and await it to prevent race condition with SessionManager
      try {
        await updateUser(user.username, { session_token: sessionToken })
      } catch (err) {
        console.error('Failed to set session token', err)
        // Continue anyway, otherwise login is blocked by network issues? 
        // Ideally should block if session strictly required, but for now we proceed.
      }

      // Login with the new token included in user object
      login({ ...user, session_token: sessionToken })
      navigate('/')
    } else {
      setError('Invalid username or password')
    }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setChangePassError('')
    setChangePassSuccess('')

    const { username, currentPassword, newPassword, confirmPassword } = changePassData

    if (newPassword !== confirmPassword) {
      setChangePassError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setChangePassError('New password must be at least 6 characters')
      return
    }

    const user = data.users.find(u => u.username === username.toLowerCase() && u.password === currentPassword)
    
    if (!user) {
      setChangePassError('Invalid username or current password')
      return
    }

    try {
      await updateUser(user.username, { password: newPassword })
      setChangePassSuccess('Password updated successfully! You can now login.')
      setChangePassData({
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => {
        setShowPasswordModal(false)
        setChangePassSuccess('')
      }, 2000)
    } catch (err) {
      setChangePassError('Failed to update password. Please try again.')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-sidebar to-primary-sidebarLight relative">
      {/* Change Password Button */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm"
        >
          <Key size={18} />
          <span className="text-sm font-medium">Change Password</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.jpg" alt="IGH Logo" className="h-32 w-auto rounded-lg" />
          </div>
          <p className="text-center text-gray-600 font-semibold mb-2">Where Creativity Meets Excellence</p>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">IGH Business Management System</h1>

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Enter your username"
                required
                autoComplete="off"
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
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full shadow-lg hover:shadow-xl transition-all">
              Sign In
            </button>
          </form>

          {/* Demo credentials section removed */}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={changePassData.username}
                onChange={(e) => setChangePassData({...changePassData, username: e.target.value})}
                className="form-input pl-10"
                placeholder="Username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={changePassData.currentPassword}
                onChange={(e) => setChangePassData({...changePassData, currentPassword: e.target.value})}
                className="form-input pl-10"
                placeholder="Current Password"
                required
              />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700 my-4" />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={changePassData.newPassword}
                onChange={(e) => setChangePassData({...changePassData, newPassword: e.target.value})}
                className="form-input pl-10"
                placeholder="New Password"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={changePassData.confirmPassword}
                onChange={(e) => setChangePassData({...changePassData, confirmPassword: e.target.value})}
                className="form-input pl-10"
                placeholder="Confirm New Password"
                required
              />
            </div>
          </div>

          {changePassError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {changePassError}
            </div>
          )}

          {changePassSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
              {changePassSuccess}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
