import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabaseClient'

export default function SessionManager() {
  const { user, logout } = useAuth()
  const { data } = useData()
  const navigate = useNavigate()
  const processingLogout = useRef(false)

  // Function to handle logout
  const performLogout = () => {
    if (processingLogout.current) return
    processingLogout.current = true
    
    console.warn('Session mismatch detected. Logging out.')
    alert('You have been logged out because this account was accessed from another device.')
    logout()
    navigate('/login')
  }

  // 1. Check against Real-time Data (Fastest if WebSocket is working)
  useEffect(() => {
    if (!user || !user.username || processingLogout.current) return

    const remoteUser = data.users.find(u => u.username === user.username)

    if (remoteUser) {
      if (remoteUser.session_token && remoteUser.session_token !== user.session_token) {
        performLogout()
      }
    }
  }, [user, data.users, logout, navigate])

  // 2. Polling Fallback (Robustness for when WebSocket lags/fails)
  useEffect(() => {
    if (!user || !user.username || processingLogout.current) return

    const checkSession = async () => {
      if (processingLogout.current) return

      try {
        const { data: remoteData, error } = await supabase
          .from('users')
          .select('session_token')
          .eq('username', user.username)
          .single()

        if (error || !remoteData) return

        if (remoteData.session_token && remoteData.session_token !== user.session_token) {
          performLogout()
        }
      } catch (err) {
        console.error('Session check failed', err)
      }
    }

    // Check immediately on mount
    checkSession()

    // Then poll every 2 seconds
    const intervalId = setInterval(checkSession, 2000)

    return () => clearInterval(intervalId)
  }, [user]) // Only re-establish if user changes

  return null
}
