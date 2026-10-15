import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  // On page load, check whether the saved token still works
  useEffect(() => {
    if (!getToken()) return
    api('/auth/me.php')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login.php', { method: 'POST', body: { email, password, device: 'web' } })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (fields) => {
    const data = await api('/auth/register.php', { method: 'POST', body: { ...fields, device: 'web' } })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout.php', { method: 'POST' })
    } catch {
      /* token may already be expired */
    }
    setToken(null)
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

/** Where each role lands after logging in. */
export const homeFor = (role) => ({ admin: '/admin', officer: '/officer' })[role] || '/home'
