import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import supabase from '../lib/supabaseClient'
import Modal from '../components/Modal'
import { Lock, Key, User, Save, ShieldCheck, Sparkles, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
  const { updateUser } = useData()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: user, error: loginErr } = await supabase
        .from('users')
        .select('username, email, role, branch, pref_compact')
        .eq('username', username.toLowerCase())
        .eq('password', password)
        .single()

      if (loginErr || !user) {
        setError('Invalid username or password. Please try again.')
        setLoading(false)
        return
      }

      const sessionToken = Date.now().toString(36) + Math.random().toString(36).substr(2)
      await updateUser(user.username, { session_token: sessionToken })

      login({ ...user, session_token: sessionToken })
      navigate('/')
    } catch (err) {
      console.error('Login failed:', err)
      setError('System error during login. Please try again.')
      setLoading(false)
    }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setChangePassError('')
    setChangePassSuccess('')

    const { username: userToChange, currentPassword, newPassword, confirmPassword } = changePassData

    if (newPassword !== confirmPassword) {
      setChangePassError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setChangePassError('New password must be at least 6 characters')
      return
    }

    try {
      const { data: user, error: verifyErr } = await supabase
        .from('users')
        .select('username')
        .eq('username', userToChange.toLowerCase())
        .eq('password', currentPassword)
        .single()

      if (verifyErr || !user) {
        setChangePassError('Invalid username or current password')
        return
      }

      await updateUser(user.username, { password: newPassword })
      setChangePassSuccess('Password updated successfully! You can now login.')
      setChangePassData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })

      setTimeout(() => {
        setShowPasswordModal(false)
        setChangePassSuccess('')
      }, 2500)
    } catch (err) {
      setChangePassError('Failed to update password. Please try again.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0f172a 40%, #1a0a2e 70%, #0f172a 100%)' }}
    >
      {/* ── Decorative Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 60%)', filter: 'blur(40px)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* ── Change Password Button ── */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-all px-4 py-2.5 rounded-xl text-xs font-bold"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Key size={14} className="text-amber-400" />
          Change Password
        </button>
      </div>

      {/* ── Login Card ── */}
      <div className="w-full max-w-md z-10 animate-slide-up">
        <div
          className="rounded-3xl p-8 space-y-7"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.05) inset',
          }}
        >
          {/* Logo + Branding */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div
                className="p-2 rounded-2xl"
                style={{
                  background: 'white',
                  boxShadow: '0 0 0 4px rgba(245,158,11,0.2), 0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src="/logo.jpg"
                  alt="IGH Logo"
                  className="h-20 w-auto rounded-xl object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                IGH Business Management
              </h1>
              <p className="flex items-center justify-center gap-1.5 mt-2 text-xs font-semibold"
                style={{ color: '#f59e0b' }}
              >
                <Sparkles size={13} />
                Where Creativity Meets Excellence
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  size={17}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '--tw-ring-color': 'rgba(245,158,11,0.4)',
                    focusRingColor: 'rgba(245,158,11,0.4)',
                  }}
                  placeholder="Enter your username"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  size={17}
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 text-sm font-medium rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
              >
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-extrabold uppercase tracking-wider rounded-xl text-white transition-all duration-200 shadow-gold-glow hover:shadow-gold-glow active:scale-[0.98]"
              style={{
                background: loading
                  ? 'rgba(245,158,11,0.5)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)',
              }}
            >
              {loading ? 'Signing In...' : 'Sign In to System'}
            </button>
          </form>

          <div className="text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
            <p className="text-[11px] text-slate-600">
              Secure Access · Authorized IGH &amp; iGift Staff Only
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setChangePassError(''); setChangePassSuccess('') }}
        title="Change Staff Password"
        size="sm"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          <div>
            <label className="form-label">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={changePassData.username}
                onChange={(e) => setChangePassData({...changePassData, username: e.target.value})}
                className="form-input pl-10"
                placeholder="Enter username..."
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                value={changePassData.currentPassword}
                onChange={(e) => setChangePassData({...changePassData, currentPassword: e.target.value})}
                className="form-input pl-10"
                placeholder="Current password"
                required
              />
            </div>
          </div>

          <div className="divider" />

          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                value={changePassData.newPassword}
                onChange={(e) => setChangePassData({...changePassData, newPassword: e.target.value})}
                className="form-input pl-10"
                placeholder="Min 6 characters"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                value={changePassData.confirmPassword}
                onChange={(e) => setChangePassData({...changePassData, confirmPassword: e.target.value})}
                className="form-input pl-10"
                placeholder="Re-type new password"
                required
              />
            </div>
          </div>

          {changePassError && (
            <div className="alert-danger text-xs">
              <AlertTriangle size={14} className="shrink-0" />
              {changePassError}
            </div>
          )}

          {changePassSuccess && (
            <div className="alert-success text-xs">
              <ShieldCheck size={14} className="shrink-0" />
              {changePassSuccess}
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="submit" className="btn-success flex-1 py-2.5 text-xs font-bold uppercase tracking-wider">
              <Save size={14} />
              Update Password
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
