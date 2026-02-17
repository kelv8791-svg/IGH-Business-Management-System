import { useEffect } from 'react'
import { useAuth } from '../App'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'

export default function SessionManager() {
  const { user, logout } = useAuth()
  const { data } = useData()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !user.username) return

    // Find the current user's record in the real-time data
    const remoteUser = data.users.find(u => u.username === user.username)

    if (remoteUser) {
      // If the remote session token exists and is different from the local one
      if (remoteUser.session_token && remoteUser.session_token !== user.session_token) {
        console.warn('Session mismatch detected. Logging out.')
        alert('You have been logged out because this account was accessed from another device.')
        logout()
        navigate('/login')
      }
    }
  }, [user, data.users, logout, navigate])

  return null // This component doesn't render anything
}
