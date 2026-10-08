import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from './api'
import type { AuthUser } from './types'

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'guest'; user: null }
  | { status: 'error'; user: null; message: string }
  | { status: 'ready'; user: AuthUser }

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: AuthUser }>('/api/auth/me')
      setState({ status: 'ready', user: data.user })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setState({ status: 'guest', user: null })
      } else {
        setState({ status: 'error', user: null, message: 'No se puede comprobar tu acceso. Revisa la conexión y vuelve a intentarlo.' })
      }
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const expired = () => setState({ status: 'guest', user: null })
    window.addEventListener('session-expired', expired)
    return () => window.removeEventListener('session-expired', expired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setState({ status: 'ready', user: data.user })
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setState({ status: 'guest', user: null })
    }
  }, [])

  const value = useMemo(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return value
}
