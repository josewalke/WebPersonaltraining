import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { api } from '../api'
import { SoftSwap } from '../components/Reveal'
import { useAuth } from '../auth-context'
import { AdminStudioNav } from './AdminStudioNav'

export type AdminLead = {
  id: string
  fullName: string
  email: string
  phone: string | null
  preferredModality: string | null
  serviceName: string | null
  message: string | null
  status: string
  createdAt: string
}

export type AdminClient = {
  id: string
  email: string
  displayName: string
  isActive: boolean
}

type AdminShellValue = {
  leads: AdminLead[]
  clients: AdminClient[]
  clientId: string
  setClientId: (id: string) => void
  setLeads: React.Dispatch<React.SetStateAction<AdminLead[]>>
  reload: () => Promise<void>
  loading: boolean
  error: string | null
  setError: (value: string | null) => void
  notice: string | null
  setNotice: (value: string | null) => void
}

const AdminShellContext = createContext<AdminShellValue | null>(null)

export function useAdminShell() {
  const value = useContext(AdminShellContext)
  if (!value) {
    throw new Error('useAdminShell debe usarse dentro de AdminShell.')
  }
  return value
}

function AdminShellHeader() {
  const auth = useAuth()
  const location = useLocation()
  const onLibrary = location.pathname.startsWith('/admin/ejercicios')
  const name = auth.user?.displayName ?? 'Administrador'
  const title = onLibrary ? 'Ejercicios' : 'Estudio'
  const copy = onLibrary
    ? `Hola, ${name}. Crea categorías y fichas aquí. El plan se asigna en Entrenar.`
    : `Hola, ${name}. Asigna el plan, da accesos y revisa solicitudes. Las fichas están en Ejercicios.`

  return (
    <header>
      <p className="text-[11px] tracking-[0.22em] text-ink-soft">administrador</p>
      <SoftSwap panelKey={title}>
        <h1 className="mt-4 font-display text-4xl text-pretty sm:text-5xl md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-lg text-sm text-ink-soft sm:text-base">{copy}</p>
      </SoftSwap>
    </header>
  )
}

export function AdminShell() {
  const location = useLocation()
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [clients, setClients] = useState<AdminClient[]>([])
  const [clientId, setClientId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const contentKey = location.pathname.startsWith('/admin/ejercicios') ? 'ejercicios' : 'estudio'

  const reload = useCallback(async () => {
    const [leadData, clientData] = await Promise.all([
      api<{ leads: AdminLead[] }>('/api/admin/leads'),
      api<{ clients: AdminClient[] }>('/api/admin/clients'),
    ])
    setLeads(leadData.leads)
    setClients(clientData.clients)
    setClientId((current) => {
      if (current && clientData.clients.some((item) => item.id === current)) {
        return current
      }
      return clientData.clients[0]?.id ?? ''
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    void reload()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se ha podido cargar el estudio.')
      })
      .finally(() => setLoading(false))
  }, [reload])

  const value = useMemo(
    () => ({
      leads,
      clients,
      clientId,
      setClientId,
      setLeads,
      reload,
      loading,
      error,
      setError,
      notice,
      setNotice,
    }),
    [leads, clients, clientId, reload, loading, error, notice],
  )

  return (
    <AdminShellContext.Provider value={value}>
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
        <AdminShellHeader />
        <AdminStudioNav clientCount={clients.length} leadCount={leads.length} />
        {error ? (
          <p className="mt-6 text-ember" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-6 text-paper" role="status">
            {notice}
          </p>
        ) : null}
        <div className="mt-10">
          <SoftSwap panelKey={contentKey}>
            <Outlet />
          </SoftSwap>
        </div>
      </main>
    </AdminShellContext.Provider>
  )
}
