import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context'
import type { UserRole } from '../types'

const DEMO_ENABLED =
  import.meta.env.DEV ||
  String(import.meta.env.VITE_DEMO_LOGIN ?? '').toLowerCase() === 'true' ||
  String(import.meta.env.VITE_DATA_MODE ?? '').toLowerCase() === 'local'

/** Credenciales solo en desarrollo/demo; no se incluyen en el bundle de producción. */
const DEMO = DEMO_ENABLED
  ? ({
      admin: {
        email: 'admin@powerup.local',
        password: 'PowerUp-admin-10',
      },
      client: {
        email: 'cliente@powerup.local',
        password: 'PowerUp-cliente-10',
      },
    } as const)
  : null

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [role, setRole] = useState<UserRole>('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (auth.status === 'ready' && auth.user) {
    return <Navigate to={auth.user.role === 'admin' ? '/admin' : '/cuenta'} replace />
  }

  function pickRole(next: UserRole) {
    setRole(next)
    if (DEMO) {
      setEmail(DEMO[next].email)
      setPassword(DEMO[next].password)
    }
    setError(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSending(true)
    try {
      const user = await auth.login(email, password)
      const fallback = user.role === 'admin' ? '/admin' : '/cuenta'
      navigate(from && from !== '/acceso' ? from : fallback, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido entrar.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 pt-28 pb-24 sm:gap-12 sm:px-6 sm:pt-32 md:grid-cols-12">
      <div className="md:col-span-5">
        <p className="text-[11px] tracking-[0.22em] text-ink-soft">acceso</p>
        <h1 className="mt-4 font-display text-4xl text-pretty sm:text-5xl md:text-6xl">Entra a tu espacio</h1>
        <p className="mt-4 max-w-sm text-sm text-ink-soft sm:text-base">
          Si el estudio te ha creado una cuenta de cliente, entra con tu email y contraseña. El acceso de
          administrador es solo para quien gestiona Power Up.
        </p>
      </div>
      <div className="rounded-[1.5rem] bg-clay p-5 ring-1 ring-white/10 sm:rounded-[2rem] sm:p-6 md:col-span-7 md:p-8">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-ink p-1 ring-1 ring-white/10 sm:gap-2" role="group" aria-label="Tipo de cuenta">
          <button
            type="button"
            aria-pressed={role === 'client'}
            onClick={() => pickRole('client')}
            className={[
              'tap min-h-11 rounded-full px-2 text-xs sm:px-4 sm:text-sm',
              role === 'client' ? 'brand-fill font-medium text-ink' : 'text-ink-soft hover:text-paper',
            ].join(' ')}
          >
            Cliente
          </button>
          <button
            type="button"
            aria-pressed={role === 'admin'}
            onClick={() => pickRole('admin')}
            className={[
              'tap min-h-11 rounded-full px-2 text-xs sm:px-4 sm:text-sm',
              role === 'admin' ? 'brand-fill font-medium text-ink' : 'text-ink-soft hover:text-paper',
            ].join(' ')}
          >
            Administrador
          </button>
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          {role === 'admin'
            ? 'Gestión del estudio: biblioteca, planes, clientes y solicitudes.'
            : 'Tu plan semanal: marca lo que hiciste cada día.'}
        </p>
        {DEMO_ENABLED ? (
          <p className="mt-2 text-xs text-ink-soft/80">
            Solo en desarrollo. Demo:{' '}
            {role === 'admin' ? 'admin@powerup.local' : 'cliente@powerup.local (Ana García)'}. Pulsa el tipo
            de cuenta para precargar.
          </p>
        ) : null}
        <form className="mt-6 grid gap-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="acceso-email" className="mb-2 block text-sm">
              Email
            </label>
            <input
              id="acceso-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border-0 bg-ink px-4 py-3 text-paper ring-1 ring-white/15 focus-visible:ring-2 focus-visible:ring-ember"
            />
          </div>
          <div>
            <label htmlFor="acceso-password" className="mb-2 block text-sm">
              Contraseña
            </label>
            <input
              id="acceso-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border-0 bg-ink px-4 py-3 text-paper ring-1 ring-white/15 focus-visible:ring-2 focus-visible:ring-ember"
            />
          </div>
          {error ? (
            <p className="text-ember" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={sending}
            className="tap min-h-12 rounded-full brand-fill px-8 py-3 font-medium text-ink disabled:opacity-60"
          >
            {sending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-sm text-ink-soft">
          ¿Aún no tienes cuenta de cliente?{' '}
          <Link to="/contacto" className="text-ember underline underline-offset-4">
            Pide plaza
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
