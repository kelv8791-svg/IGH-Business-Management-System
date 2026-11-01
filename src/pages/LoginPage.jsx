import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import supabase from '../lib/supabaseClient'
import Modal from '../components/Modal'
import { Lock, Key, User, Save, ShieldCheck, Eye, EyeOff, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

/* ── Branded slides for the right panel ── */
/* Services offered by IGH & iGIFT — sourced directly from identitygraphics.co.ke */
const ighServices = [
  '3D & 2D Signages', 'Large Format Printing', 'Digital Printing',
  'Garment & T-Shirt Printing', 'Rollup & Teardrop Banners', 'Gazebos & Tent Printing',
  'Lightbox & Pylon Signs', 'Brochures & Flyers', 'Business Cards',
  'iGIFT Custom Merchandise', 'Gift Cards & Bags', 'Custom Packaging',
]

const slides = [
  {
    tagline: 'Top Quality Graphics Design, Printing & Branding',
    quote: '"We specialize in creating visually striking and impactful branding solutions that help businesses stand out and connect with their audiences. Based in Nakuru, we pride ourselves on being a creative hub where design meets strategy."',
    author: 'Identity Graphics Houz — Nakuru',
    role: 'Official Portal · identitygraphics.co.ke',
  },
  {
    tagline: 'Empowering Businesses with Tools to Succeed',
    quote: '"From eye-catching signages to professional printing and custom graphics — our mission is to empower businesses with tools that boost visibility, enhance credibility, and drive growth."',
    author: 'identitygraphics.co.ke',
    role: 'Signages · Garments · Large Format · Digital Print',
  },
  {
    tagline: 'Trusted by Businesses Across Kenya',
    quote: '"The best graphics design and printing company around Nakuru. Loved the overall experience branding my shop. Excellent customer service, timely delivery at friendly costs."',
    author: 'Verified Google Review',
    role: 'Rated 5 Stars by Valued Clients',
  },
  {
    tagline: 'iGIFT Shop — Gift the Extraordinary',
    quote: '"Custom corporate gift bags, branded gift cards, promotional hoodies, caps, jerseys, and memorable merchandise that keep your brand unforgettable."',
    author: 'iGIFT Shop & Merchandise',
    role: 'Corporate Gifting & Custom Merchandise Division',
  },
  {
    tagline: 'IGH Business Management System',
    quote: '"Streamlining graphic design workflows, sales pipelines, branch inventory, and supplier accounts across IGH & iGIFT — real-time control, zero guesswork."',
    author: 'IGH Operational Management',
    role: 'Secure Enterprise Staff & Admin Portal',
  },
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slideIdx, setSlideIdx] = useState(0)

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

  /* Auto-advance slides */
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx(i => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const prevSlide = () => setSlideIdx(i => (i - 1 + slides.length) % slides.length)
  const nextSlide = () => setSlideIdx(i => (i + 1) % slides.length)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const normalizedUsername = (username || '').trim().toLowerCase()

    try {
      // 1. Try secure cryptographic login RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('verify_user_login', {
        p_username: normalizedUsername,
        p_password: password
      })

      let authenticatedUser = null

      if (!rpcErr && rpcRes) {
        if (!rpcRes.success) {
          setError(rpcRes.message || 'Invalid username or password. Please try again.')
          return
        }
        authenticatedUser = rpcRes.user
      } else {
        // Fallback: direct query if RPC is not yet registered in SQL editor
        const { data: user, error: loginErr } = await supabase
          .from('users')
          .select('username, email, role, branch, pref_compact')
          .eq('username', normalizedUsername)
          .eq('password', password)
          .single()

        if (loginErr || !user) {
          setError('Invalid username or password. Please try again.')
          return
        }
        authenticatedUser = user
      }

      // Generate secure session token
      const sessionToken = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).substring(2))

      try {
        await supabase
          .from('users')
          .update({ session_token: sessionToken })
          .eq('username', normalizedUsername)
      } catch (tokenErr) {
        console.warn('Session token update notice:', tokenErr)
      }

      login({ ...authenticatedUser, session_token: sessionToken })
      navigate('/')
    } catch (err) {
      console.error('Login failed:', err)
      setError('System error during login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    setChangePassError('')
    setChangePassSuccess('')

    const { username: userToChange, currentPassword, newPassword, confirmPassword } = changePassData
    const normalizedUser = (userToChange || '').trim().toLowerCase()

    if (!normalizedUser) {
      setChangePassError('Please enter your username.')
      return
    }
    if (newPassword.length < 6) {
      setChangePassError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setChangePassError('New passwords do not match.')
      return
    }

    try {
      // 1. Try secure RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('change_user_password', {
        p_username: normalizedUser,
        p_current_password: currentPassword,
        p_new_password: newPassword
      })

      if (!rpcErr && rpcRes) {
        if (!rpcRes.success) {
          setChangePassError(rpcRes.message || 'Current password incorrect.')
          return
        }
      } else {
        // Fallback: verify and update directly
        const { data: targetUser, error: findErr } = await supabase
          .from('users')
          .select('id, username, password')
          .eq('username', normalizedUser)
          .eq('password', currentPassword)
          .single()

        if (findErr || !targetUser) {
          setChangePassError('Current password incorrect or user not found.')
          return
        }

        const { error: updateErr } = await supabase
          .from('users')
          .update({ password: newPassword })
          .eq('id', targetUser.id)

        if (updateErr) {
          setChangePassError('Failed to update password. Please try again.')
          return
        }
      }

      setChangePassSuccess('Password updated successfully! You can now log in.')
      setChangePassData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        setShowPasswordModal(false)
        setChangePassSuccess('')
      }, 1500)
    } catch (err) {
      console.error('Password change error:', err)
      setChangePassError('Failed to update password. Please try again.')
    }
  }

  const slide = slides[slideIdx]

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0d0d0d' }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', filter: 'blur(100px)' }}
        />
      </div>

      {/* ── Change Password Button (top right) ── */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#888',
            backdropFilter: 'blur(12px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--igh-orange)'
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.30)'
            e.currentTarget.style.background = 'rgba(249,115,22,0.07)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#888'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          }}
        >
          <Key size={14} style={{ color: 'var(--igh-orange)' }} />
          Change Password
        </button>
      </div>

      {/* ── SPLIT CARD ── */}
      <div
        className="w-full z-10 animate-slide-up"
        style={{ maxWidth: '1060px' }}
      >
        <div
          className="flex flex-col md:flex-row rounded-3xl overflow-hidden items-stretch"
          style={{
            minHeight: '660px',
            background: 'var(--igh-surface-1)',
            border: '1px solid var(--igh-border)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(249,115,22,0.07) inset',
          }}
        >
          {/* ══ LEFT — Login Form ══ */}
          <div className="flex-1 p-8 sm:p-10 lg:p-12 flex flex-col justify-between" style={{ minWidth: 0 }}>
            <div>
              {/* Logo + Title */}
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
                    style={{
                      background: '#0d0d0d',
                      border: '2px solid rgba(249,115,22,0.40)',
                      boxShadow: '0 0 18px rgba(249,115,22,0.25)',
                    }}
                  >
                    <img src="/logo.jpg" alt="IGH Logo" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div>
                    <h1
                      className="text-lg font-black tracking-tight leading-none"
                      style={{ color: 'var(--igh-text-primary)' }}
                    >
                      IGH · iGIFT
                    </h1>
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--igh-orange)' }}>
                      Business Management System
                    </p>
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--igh-text-primary)' }}>
                  Welcome back
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--igh-text-muted)' }}>
                  Please enter your details to sign in.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                {/* Username */}
                <div>
                  <label className="form-label">Username</label>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      size={15}
                      style={{ color: 'var(--igh-text-faint)' }}
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-input pl-10"
                      placeholder="Enter your username"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label mb-0">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="text-[11px] font-semibold transition-colors"
                      style={{ color: 'var(--igh-orange)' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      size={15}
                      style={{ color: 'var(--igh-text-faint)' }}
                    />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input pl-10 pr-12"
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--igh-text-faint)' }}
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="alert-danger text-xs">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm font-extrabold uppercase tracking-wider mt-2"
                >
                  {loading ? 'Signing In…' : 'Log In'}
                </button>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] mt-6" style={{ color: 'var(--igh-text-faint)' }}>
              © {new Date().getFullYear()} IGH Business Management · Authorized Staff Only
            </p>
          </div>

          {/* ══ RIGHT — Branded Showcase & Slideshow Panel ══ */}
          <div
            className="hidden md:flex relative flex-col justify-between overflow-hidden"
            style={{
              width: '50%',
              minWidth: '460px',
              flexShrink: 0,
              background: 'linear-gradient(170deg, #182A42 0%, #14243B 60%, #0d1726 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Ambient orange glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 80% 20%, rgba(249,115,22,0.15) 0%, transparent 70%)',
              }}
            />

            {/* Branded visual showcase image replacing duplicate logo */}
            <div className="relative mx-7 mt-7 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group flex-shrink-0">
              <img
                src="/login-showcase.jpg"
                alt="IGH Business Suite"
                className="w-full h-48 object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(20,36,59,0.90) 0%, rgba(20,36,59,0.20) 60%, transparent 100%)',
                }}
              />
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                <span className="text-[10px] font-bold text-white/95 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/15">
                  Business Operations
                </span>
                <span className="text-[10px] font-bold text-orange-300 bg-orange-950/80 px-2.5 py-1 rounded-full border border-orange-500/40">
                  IGH · iGIFT
                </span>
              </div>
            </div>

            {/* Slide content with CONSTANT sizing to eliminate any layout shifting */}
            <div className="relative z-10 px-7 pb-7 pt-4 flex-1 flex flex-col justify-between">
              {/* Top: Tagline + Quote + Author */}
              <div>
                {/* Orange accent bar */}
                <div
                  className="w-8 h-1 rounded-full mb-3"
                  style={{ background: 'var(--igh-orange)' }}
                />

                {/* Tagline with fixed height */}
                <div className="min-h-[20px] mb-2">
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest leading-tight"
                    style={{ color: 'var(--igh-orange)' }}
                  >
                    {slide.tagline}
                  </p>
                </div>

                {/* Quote block with fixed height so card NEVER resizes */}
                <div className="min-h-[76px] flex items-center mb-3">
                  <blockquote
                    className="text-xs sm:text-[13px] font-medium leading-relaxed transition-opacity duration-300"
                    style={{ color: '#E2E8F0' }}
                  >
                    {slide.quote}
                  </blockquote>
                </div>

                {/* Author & Role with fixed height */}
                <div className="min-h-[38px]">
                  <p className="text-xs font-bold leading-tight" style={{ color: '#FFFFFF' }}>
                    {slide.author}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-tight" style={{ color: '#94A3B8' }}>
                    {slide.role}
                  </p>
                </div>
              </div>

              {/* Bottom: Navigation + Services */}
              <div>
                {/* Slide navigation */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={prevSlide}
                    aria-label="Previous Slide"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#94A3B8',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--igh-orange)'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.color = '#94A3B8'
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {/* Dots */}
                  <div className="flex gap-1.5 items-center">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIdx(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className="rounded-full transition-all duration-300 cursor-pointer"
                        style={{
                          width: i === slideIdx ? '22px' : '6px',
                          height: '6px',
                          background: i === slideIdx ? 'var(--igh-orange)' : 'rgba(255,255,255,0.18)',
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextSlide}
                    aria-label="Next Slide"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#94A3B8',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--igh-orange)'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.color = '#94A3B8'
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* IGH Services Strip — sourced from identitygraphics.co.ke */}
                <div className="pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Our Core Services
                    </p>
                    <span className="text-[9px] font-medium tracking-wide" style={{ color: 'rgba(249,115,22,0.8)' }}>
                      identitygraphics.co.ke
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ighServices.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors hover:text-white"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          color: 'rgba(255,255,255,0.65)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Change Password Modal ══ */}
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
              <input
                type="text"
                value={changePassData.username}
                onChange={(e) => setChangePassData({...changePassData, username: e.target.value})}
                className="form-input pl-10"
                placeholder="Enter username…"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--igh-text-faint)' }} />
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
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--igh-text-faint)' }} />
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
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--igh-text-faint)' }} />
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

          <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid var(--igh-border)' }}>
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
