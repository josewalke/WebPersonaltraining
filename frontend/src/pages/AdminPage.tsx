import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { SoftSwap } from '../components/Reveal'
import { AdminExercises } from './AdminExercises'
import { useAdminShell } from './AdminShell'

type Tab = 'entrenar' | 'clientes' | 'solicitudes'

const STATUSES = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'ganado', label: 'Ganado' },
  { value: 'perdido', label: 'Perdido' },
]

function tabFromHash(): Tab {
  const value = window.location.hash.replace('#', '')
  if (value === 'clientes' || value === 'solicitudes' || value === 'entrenar') {
    return value
  }
  return 'entrenar'
}

const fieldClass =
  'w-full rounded-2xl border-0 bg-ink px-4 py-3 text-paper ring-1 ring-white/15 focus-visible:ring-2 focus-visible:ring-ember'

export function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    leads,
    clients,
    clientId,
    setClientId,
    setLeads,
    reload,
    loading,
    setError,
    setNotice,
  } = useAdminShell()
  const [tab, setTab] = useState<Tab>(() => (typeof window === 'undefined' ? 'entrenar' : tabFromHash()))
  const [creating, setCreating] = useState(false)
  const [clientQuery, setClientQuery] = useState('')
  const [leadQuery, setLeadQuery] = useState('')
  const [leadStatus, setLeadStatus] = useState('all')

  const filteredClients = useMemo(() => {
    const needle = clientQuery.trim().toLowerCase()
    if (!needle) return clients
    return clients.filter(
      (item) =>
        item.displayName.toLowerCase().includes(needle) || item.email.toLowerCase().includes(needle),
    )
  }, [clientQuery, clients])

  const filteredLeads = useMemo(() => {
    const needle = leadQuery.trim().toLowerCase()
    return leads.filter((lead) => {
      if (leadStatus !== 'all' && lead.status !== leadStatus) return false
      if (!needle) return true
      return (
        lead.fullName.toLowerCase().includes(needle) ||
        lead.email.toLowerCase().includes(needle) ||
        (lead.message ?? '').toLowerCase().includes(needle) ||
        (lead.preferredModality ?? '').toLowerCase().includes(needle)
      )
    })
  }, [leadQuery, leadStatus, leads])

  useEffect(() => {
    setTab(tabFromHash())
  }, [location.hash, location.pathname])

  function go(next: Tab) {
    setTab(next)
    setError(null)
    setNotice(null)
    navigate(`/admin#${next}`, { replace: true })
  }

  async function onStatus(id: string, status: string) {
    setError(null)
    try {
      await api(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido actualizar.')
    }
  }

  async function onCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    const form = event.currentTarget
    const data = new FormData(form)
    setCreating(true)
    try {
      const created = await api<{ user: { id: string } }>('/api/admin/clients', {
        method: 'POST',
        body: JSON.stringify({
          displayName: String(data.get('displayName') ?? ''),
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
        }),
      })
      form.reset()
      await reload()
      setClientId(created.user.id)
      setNotice('Cliente creado. Ya puedes entrenarlo.')
      go('entrenar')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido crear.')
    } finally {
      setCreating(false)
    }
  }

  if (loading && clients.length === 0) {
    return <p className="text-ink-soft">Cargando estudio…</p>
  }

  return (
    <SoftSwap panelKey={tab}>
      {tab === 'entrenar' ? (
        <AdminExercises clients={clients} clientId={clientId} onClientId={setClientId} />
      ) : null}

      {tab === 'clientes' ? (
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl">Dar acceso</h2>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">Crea la cuenta. El cliente entra en Acceso con ese email.</p>
            <form className="mt-6 grid gap-4" onSubmit={onCreateClient}>
              <div>
                <label htmlFor="client-name" className="mb-2 block text-sm">
                  Nombre
                </label>
                <input id="client-name" name="displayName" required minLength={2} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="client-email" className="mb-2 block text-sm">
                  Email
                </label>
                <input id="client-email" name="email" type="email" required autoComplete="off" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="client-password" className="mb-2 block text-sm">
                  Contraseña inicial
                </label>
                <input
                  id="client-password"
                  name="password"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  className={fieldClass}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="tap min-h-12 rounded-full brand-fill px-6 py-3 font-medium text-ink disabled:opacity-60"
              >
                {creating ? 'Creando…' : 'Crear y pasar a entrenar'}
              </button>
            </form>
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl">Cuentas</h2>
            {clients.length === 0 ? (
              <p className="mt-4 text-ink-soft">Aún no hay clientes.</p>
            ) : (
              <>
                <label className="sr-only" htmlFor="client-search">
                  Buscar cliente
                </label>
                <input
                  id="client-search"
                  type="search"
                  value={clientQuery}
                  onChange={(event) => setClientQuery(event.target.value)}
                  placeholder="Buscar por nombre o email…"
                  className={`mt-4 ${fieldClass}`}
                />
                {filteredClients.length === 0 ? (
                  <p className="mt-4 text-ink-soft">Ningún cliente coincide.</p>
                ) : (
                  <ul className="mt-4 grid gap-3">
                    {filteredClients.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="tap w-full rounded-2xl bg-clay px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/5"
                          onClick={() => {
                            setClientId(item.id)
                            go('entrenar')
                          }}
                        >
                          <p>{item.displayName}</p>
                          <p className="text-sm text-ink-soft">{item.email}</p>
                          <p className="mt-2 text-sm text-ember">Abrir plan</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'solicitudes' ? (
        <div>
          <h2 className="font-display text-2xl sm:text-3xl">Solicitudes</h2>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Gente que pidió plaza. Filtra y cámbiales el estado cuando las atiendas.
          </p>
          {leads.length === 0 ? (
            <p className="mt-6 text-ink-soft">Todavía no hay solicitudes.</p>
          ) : (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="sr-only" htmlFor="lead-search">
                  Buscar solicitud
                </label>
                <input
                  id="lead-search"
                  type="search"
                  value={leadQuery}
                  onChange={(event) => setLeadQuery(event.target.value)}
                  placeholder="Buscar por nombre, email o mensaje…"
                  className={fieldClass}
                />
                <select
                  aria-label="Filtrar por estado"
                  value={leadStatus}
                  onChange={(event) => setLeadStatus(event.target.value)}
                  className={fieldClass}
                >
                  <option value="all">Todos los estados</option>
                  {STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              {filteredLeads.length === 0 ? (
                <p className="mt-6 text-ink-soft">Ninguna solicitud coincide.</p>
              ) : (
                <ul className="mt-6 grid gap-4">
                  {filteredLeads.map((lead) => (
                    <li key={lead.id} className="rounded-2xl bg-clay p-5 ring-1 ring-white/10">
                      <p className="font-medium">{lead.fullName}</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ''}
                        {lead.preferredModality ? ` · ${lead.preferredModality}` : ''}
                        {lead.createdAt
                          ? ` · ${new Date(lead.createdAt).toLocaleDateString('es-ES')}`
                          : ''}
                      </p>
                      {lead.message ? <p className="mt-3 text-sm text-paper/80">{lead.message}</p> : null}
                      <fieldset className="mt-4">
                        <legend className="mb-2 text-sm text-ink-soft">Estado</legend>
                        <div className="flex flex-wrap gap-2">
                          {STATUSES.map((item) => {
                            const on = lead.status === item.value
                            return (
                              <button
                                key={item.value}
                                type="button"
                                aria-pressed={on}
                                className={[
                                  'tap rounded-full px-3 py-1.5 text-sm ring-1',
                                  on
                                    ? 'brand-fill font-medium text-ink ring-transparent'
                                    : 'bg-ink text-ink-soft ring-white/10',
                                ].join(' ')}
                                onClick={() => void onStatus(lead.id, item.value)}
                              >
                                {item.label}
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : null}
    </SoftSwap>
  )
}
