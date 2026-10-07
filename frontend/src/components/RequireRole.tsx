import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth-context'
import type { UserRole } from '../types'

export function RequireRole({
  role,
  children,
}: {
  role: UserRole
  children: ReactNode
}) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <p>Comprobando acceso…</p>
      </main>
    )
  }

  if (!auth.user) {
    return <Navigate to="/acceso" replace state={{ from: location.pathname }} />
  }

  if (auth.user.role !== role) {
    return <Navigate to={auth.user.role === 'admin' ? '/admin' : '/cuenta'} replace />
  }

  return children
}
