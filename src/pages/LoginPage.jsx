import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import supabase from '../lib/supabaseClient'
import Modal from '../components/Modal'
import { Lock, Key, User, Save, ShieldCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [changePassData, setChangePassData] = useState({
    username: '', currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [changePassError, setChangePassError] = useState('')
  const [changePassSuccess, setChangePassSuccess] = useState('')

  const navigate = useNavigate()
  const { login } = useAuth()
  const { updateUser } = useData()

  /* Brand pillars — static, replacing the rotating slideshow */
  const pillars = [
    { icon: '✦', label: 'Design', sub: 'Graphics & Branding' },
    { icon: '◈', label: 'Print', sub: 'Large Format & Digital' },
    { icon: '◆', label: 'Gift', sub: 'Corporate Merchandise' },
  ]

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const normalizedUsername = (username || '').trim().toLowerCase()
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('verify_user_login', {
        p_username: normalizedUsername,
        p_password: password,
      })
      let authenticatedUser = null
      if (!rpcErr && rpcRes) {
        if (!rpcRes.success) { setError(rpcRes.message || 'Invalid username or password. Please try again.'); return }
        authenticatedUser = rpcRes.user
      } else {
        const { data: user, error: loginErr } = await supabase
          .from('users')
          .select('username, email, role, branch, pref_compact')
          .eq('username', normalizedUsername)
          .eq('password', password)
          .single()
        if (loginErr || !user) { setError('Invalid username or password. Please try again.'); return }
        authenticatedUser = user
      }
      const sessionToken = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).substring(2)
      try {
        await supabase.from('users').update({ session_token: sessionToken }).eq('username', normalizedUsername)
      } catch (tokenErr) { console.warn('Session token update notice:', tokenErr) }
      login({ ...authenticatedUser, session_token: sessionToken })
      navigate('/')
    } catch (err) {
      console.error('Login failed:', err)
      setError('System error during login. Please try again.')
    } finally { setLoading(false) }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setChangePassError('')
    setChangePassSuccess('')
    const { username: userToChange, currentPassword, newPassword, confirmPassword } = changePassData
    const normalizedUser = (userToChange || '').trim().toLowerCase()
    if (!normalizedUser) { setChangePassError('Please enter your username.'); return }
    if (newPassword.length < 6) { setChangePassError('New password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setChangePassError('New passwords do not match.'); return }
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('change_user_password', {
        p_username: normalizedUser,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      })
      if (!rpcErr && rpcRes) {
        if (!rpcRes.success) { setChangePassError(rpcRes.message || 'Current password incorrect.'); return }
      } else {
        const { data: targetUser, error: findErr } = await supabase
          .from('users').select('id, username, password')
          .eq('username', normalizedUser).eq('password', currentPassword).single()
        if (findErr || !targetUser) { setChangePassError('Current password incorrect or user not found.'); return }
        const { error: updateErr } = await supabase.from('users').update({ password: newPassword }).eq('id', targetUser.id)
        if (updateErr) { setChangePassError('Failed to update password. Please try again.'); return }
      }
      setChangePassSuccess('Password updated successfully! You can now log in.')
      setChangePassData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => { setShowPasswordModal(false); setChangePassSuccess('') }, 1500)
    } catch (err) {
      console.error('Password change error:', err)
      setChangePassError('Failed to update password. Please try again.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)' }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%)', filter: 'blur(70px)' }} />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,36,59,0.08) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 opacity-[0.40]"
          style={{ backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Change Password Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', color: '#1E293B' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#EA580C'
            e.currentTarget.style.borderColor = '#F97316'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.18)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#1E293B'
            e.currentTarget.style.borderColor = '#CBD5E1'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Key size={14} className="text-[#F97316] stroke-[2.5]" />
          <span>Change Password</span>
        </button>
      </div>

      {/* SPLIT CARD */}
      <div className="w-full z-10 animate-slide-up" style={{ maxWidth: '1060px' }}>
        <div
          className="flex flex-col md:flex-row rounded-3xl overflow-hidden items-stretch"
          style={{
            minHeight: '660px',
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            boxShadow: '0 35px 90px -15px rgba(15,23,42,0.25), 0 15px 40px -5px rgba(15,23,42,0.16), 0 0 60px -10px rgba(249,115,22,0.18), 0 0 0 1px rgba(15,23,42,0.08)',
          }}
        >

          {/* LEFT — Login Form */}
          <div className="flex-1 p-8 sm:p-10 lg:p-12 flex flex-col justify-between" style={{ minWidth: 0, background: '#FFFFFF' }}>
            <div>
              {/* Logo + title */}
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1"
                    style={{ background: '#FFFFFF', border: '2px solid rgba(249,115,22,0.45)', boxShadow: '0 4px 14px rgba(249,115,22,0.20)' }}
                  >
                    <img src="/logo.jpg" alt="IGH Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight leading-none text-[#0F172A]">IGH · iGIFT</h1>
                    <p className="text-[11px] font-bold mt-1 text-[#EA580C]">Business Management System</p>
                  </div>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-[#0F172A]">Welcome back</h2>
                <p className="text-sm font-semibold mt-1 text-[#475569]">Please enter your details to sign in.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                <div>
                  <label className="form-label text-[#0F172A]">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" size={16} />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                      className="form-input pl-10" placeholder="Enter your username" required autoComplete="off" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label mb-0 text-[#0F172A]">Password</label>
                    <button type="button" onClick={() => setShowPasswordModal(true)}
                      className="text-[11px] font-bold transition-colors text-[#EA580C] hover:text-[#C2410C]">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" size={16} />
                    <input type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="form-input pl-10 pr-12" placeholder="••••••••" required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors text-[#64748B] hover:text-[#0F172A]" tabIndex={-1}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="alert-danger text-xs font-bold">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm font-black uppercase tracking-wider mt-2 shadow-lg">
                  {loading ? 'Signing In…' : 'Log In'}
                </button>
              </form>
            </div>

            <p className="text-center text-[11px] font-semibold mt-6 text-[#64748B]">
              © {new Date().getFullYear()} IGH Business Management · Authorized Staff Only
            </p>
          </div>

          {/* RIGHT — Brand Identity Panel (replaces slideshow) */}
          <div
            className="hidden md:flex relative flex-col overflow-hidden"
            style={{
              width: '50%',
              minWidth: '460px',
              flexShrink: 0,
              background: 'linear-gradient(165deg, #182A42 0%, #111C2E 55%, #0B121F 100%)',
              borderLeft: '1.5px solid #CBD5E1',
            }}
          >
            {/* Ambient orange glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 80% 20%, rgba(249,115,22,0.18) 0%, transparent 70%)' }} />
            {/* Subtle grid texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }} />

            {/* Showcase image */}
            <div className="relative mx-8 mt-8 rounded-2xl overflow-hidden border border-white/20 shadow-2xl group flex-shrink-0">
              <img src="/login-showcase.jpg" alt="IGH Business Suite"
                className="w-full h-52 object-cover object-top transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(17,28,46,0.90) 0%, rgba(17,28,46,0.15) 60%, transparent 100%)' }} />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span className="text-[10px] font-black text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/20">
                  Business Operations
                </span>
                <span className="text-[10px] font-black text-orange-300 bg-orange-950/80 px-2.5 py-1 rounded-full border border-orange-500/50">
                  IGH · iGIFT
                </span>
              </div>
            </div>

            {/* Brand identity block */}
            <div className="relative z-10 flex-1 flex flex-col justify-between px-8 pt-7 pb-8">
              <div>
                {/* Orange accent bar */}
                <div className="w-10 h-1 rounded-full mb-4" style={{ background: 'var(--igh-orange)' }} />

                <h3 className="text-xl font-black tracking-tight leading-snug text-white mb-1.5">
                  Identity Graphics Houz
                </h3>
                <p className="text-sm font-semibold text-[#94A3B8] leading-relaxed mb-6">
                  Nakuru's premier graphics, printing &amp; branding studio —<br />
                  powering visibility for businesses across Kenya.
                </p>

                {/* Brand pillars */}
                <div className="grid grid-cols-3 gap-3">
                  {pillars.map(({ icon, label, sub }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3.5 flex flex-col gap-1.5"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                    >
                      <span className="text-[#F97316] text-base leading-none">{icon}</span>
                      <p className="text-xs font-black text-white leading-none">{label}</p>
                      <p className="text-[10px] font-semibold text-[#94A3B8] leading-tight">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom signature */}
              <div className="pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-white/50 uppercase tracking-widest">identitygraphics.co.ke</p>
                    <p className="text-[10px] font-semibold text-[#64748B] mt-0.5">Nakuru, Kenya</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#F97316] flex-shrink-0" />
                    <span className="text-[11px] font-bold text-white/70">Authorized Portal</span>
                  </div>
                </div>
              </div>
            </div>
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
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--igh-text-faint)' }} />
              <input type="text" value={changePassData.username}
                onChange={e => setChangePassData({ ...changePassData, username: e.target.value })}
                className="form-input pl-10" placeholder="Enter username…" required />
            </div>
          </div>
          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--igh-text-faint)' }} />
              <input type="password" value={changePassData.currentPassword}
                onChange={e => setChangePassData({ ...changePassData, currentPassword: e.target.value })}
                className="form-input pl-10" placeholder="Current password" required />
            </div>
          </div>
          <div className="divider" />
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--igh-text-faint)' }} />
              <input type="password" value={changePassData.newPassword}
                onChange={e => setChangePassData({ ...changePassData, newPassword: e.target.value })}
                className="form-input pl-10" placeholder="Min 6 characters" required />
            </div>
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--igh-text-faint)' }} />
              <input type="password" value={changePassData.confirmPassword}
                onChange={e => setChangePassData({ ...changePassData, confirmPassword: e.target.value })}
                className="form-input pl-10" placeholder="Re-type new password" required />
            </div>
          </div>
          {changePassError && (
            <div className="alert-danger text-xs"><AlertTriangle size={14} className="shrink-0" />{changePassError}</div>
          )}
          {changePassSuccess && (
            <div className="alert-success text-xs"><ShieldCheck size={14} className="shrink-0" />{changePassSuccess}</div>
          )}
          <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid var(--igh-border)' }}>
            <button type="submit" className="btn-success flex-1 py-2.5 text-xs font-bold uppercase tracking-wider">
              <Save size={14} />Update Password
            </button>
            <button type="button" onClick={() => setShowPasswordModal(false)}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold uppercase tracking-wider">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

