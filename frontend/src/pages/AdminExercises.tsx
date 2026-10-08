import { useEffect, useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowClockwise, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { SoftSwap } from '../components/Reveal'
import { WEEKDAYS, type Weekday, weekdayLabel } from '../weekdays'
import { DOSE_UNITS, doseMetric, type DoseUnit } from '../dose'

export type StudioClient = {
  id: string
  email: string
  displayName: string
}

type Category = {
  id: string
  name: string
  exerciseCount: number
}

type Exercise = {
  id: string
  name: string
  description: string | null
  categoryId: string
  categoryName: string
  equipment: string
  cues: string | null
  videoUrl: string | null
}

type Assigned = {
  id: string
  exerciseId: string
  weekday: Weekday
  sets: number | null
  reps: string | null
  doseUnit: DoseUnit
  restSeconds: number | null
  notes: string | null
  completionStatus: 'done' | 'missed' | null
  exercise: Exercise
}

type ClientPlan = {
  weekStart: string
  exercises: Assigned[]
}

const fieldClass =
  'w-full rounded-2xl border-0 bg-ink px-4 py-3 text-paper ring-1 ring-white/15 focus-visible:ring-2 focus-visible:ring-ember'

function dose(item: Assigned) {
  const parts = [
    item.sets ? `${item.sets} series` : null,
    item.reps ? `${doseMetric(item.reps, item.doseUnit).value} ${item.doseUnit === 'repetitions' ? 'repeticiones' : ''}`.trim() : null,
    item.restSeconds != null ? `${item.restSeconds}s` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Sin dosis aún'
}

function completionLabel(status: Assigned['completionStatus']) {
  if (status === 'done') return 'Hecho'
  if (status === 'missed') return 'No hecho'
  return 'Pendiente'
}

function formatWeekLabel(weekStart: string) {
  const start = new Date(`${weekStart}T12:00:00`)
  if (Number.isNaN(start.getTime())) {
    return weekStart
  }
  return start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function AdminExercises({
  clients,
  clientId,
  onClientId,
}: {
  clients: StudioClient[]
  clientId: string
  onClientId: (id: string) => void
}) {
  const tabsId = useId()
  function onDayKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const days = ['all', ...WEEKDAYS.map((day) => day.value)] as const
    const index = days.findIndex((day) => day === viewDay)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % days.length
    else if (event.key === 'ArrowLeft') next = (index + days.length - 1) % days.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = days.length - 1
    else return
    event.preventDefault()
    setViewDay(days[next])
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-day="${days[next]}"]`)?.focus()
  }
  const [categories, setCategories] = useState<Category[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [assigned, setAssigned] = useState<Assigned[]>([])
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [picking, setPicking] = useState(false)
  const [pickId, setPickId] = useState('')
  const [weekday, setWeekday] = useState<Weekday>(1)
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('8-12')
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('repetitions')
  const [rest, setRest] = useState('90')
  const [notes, setNotes] = useState('')
  const [viewDay, setViewDay] = useState<Weekday | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [clientQuery, setClientQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeekday, setEditWeekday] = useState<Weekday>(1)
  const [editSets, setEditSets] = useState('3')
  const [editReps, setEditReps] = useState('8-12')
  const [editDoseUnit, setEditDoseUnit] = useState<DoseUnit>('repetitions')
  const [editRest, setEditRest] = useState('90')
  const [editNotes, setEditNotes] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const filteredClients = useMemo(() => {
    const needle = clientQuery.trim().toLowerCase()
    if (!needle) return clients
    return clients.filter(
      (item) =>
        item.displayName.toLowerCase().includes(needle) || item.email.toLowerCase().includes(needle),
    )
  }, [clientQuery, clients])

  const filtered = useMemo(() => {
    return exercises.filter((item) => filterCategory === 'all' || item.categoryId === filterCategory)
  }, [exercises, filterCategory])

  const pick = exercises.find((item) => item.id === pickId) ?? null
  const client = clients.find((item) => item.id === clientId) ?? null

  const dayCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const item of assigned) {
      counts.set(item.weekday, (counts.get(item.weekday) ?? 0) + 1)
    }
    return counts
  }, [assigned])

  const dayDoneCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const item of assigned) {
      if (item.completionStatus === 'done') {
        counts.set(item.weekday, (counts.get(item.weekday) ?? 0) + 1)
      }
    }
    return counts
  }, [assigned])

  const weekStats = useMemo(() => {
    let done = 0
    let missed = 0
    for (const item of assigned) {
      if (item.completionStatus === 'done') done += 1
      if (item.completionStatus === 'missed') missed += 1
    }
    return {
      done,
      missed,
      pending: assigned.length - done - missed,
      total: assigned.length,
    }
  }, [assigned])

  const visibleAssigned = useMemo(() => {
    if (viewDay === 'all') {
      return [...assigned]
    }
    return assigned.filter((item) => item.weekday === viewDay)
  }, [assigned, viewDay])

  const grouped = useMemo(() => {
    return WEEKDAYS.map((day) => ({
      day,
      items: visibleAssigned.filter((item) => item.weekday === day.value),
    })).filter((group) => group.items.length > 0)
  }, [visibleAssigned])

  async function loadLibrary() {
    const data = await api<{ exercises: Exercise[]; categories: Category[] }>('/api/admin/exercises')
    setExercises(data.exercises)
    setCategories(data.categories)
  }

  async function loadAssigned(id: string) {
    if (!id) {
      setAssigned([])
      setWeekStart(null)
      return
    }
    const data = await api<ClientPlan>(`/api/admin/clients/${id}/exercises`)
    setAssigned(data.exercises)
    setWeekStart(data.weekStart)
  }

  useEffect(() => {
    void loadLibrary().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'No se ha podido cargar la biblioteca.')
    })
  }, [])

  useEffect(() => {
    setEditingId(null)
    if (!clientId) {
      setAssigned([])
      setWeekStart(null)
      return
    }
    void loadAssigned(clientId).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'No se han podido cargar las asignaciones.')
    })
  }, [clientId])

  async function onRefresh() {
    if (!clientId) {
      return
    }
    setRefreshing(true)
    setError(null)
    try {
      await loadAssigned(clientId)
      setNotice('Seguimiento actualizado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido actualizar.')
    } finally {
      setRefreshing(false)
    }
  }

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!clientId || !pickId) {
      setError('Elige cliente y ejercicio.')
      return
    }
    setError(null)
    setNotice(null)
    try {
      const result = await api<ClientPlan>(`/api/admin/clients/${clientId}/exercises`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: pickId,
          weekday,
          sets: sets ? Number(sets) : null,
          reps,
          doseUnit,
          restSeconds: rest ? Number(rest) : null,
          notes,
        }),
      })
      setAssigned(result.exercises)
      setWeekStart(result.weekStart)
      setNotice(`Añadido al ${weekdayLabel(weekday).toLowerCase()} de ${client?.displayName ?? 'cliente'}.`)
      setPicking(false)
      setPickId('')
      setNotes('')
      setViewDay(weekday)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido asignar.')
    }
  }

  async function onUnassign(assignmentId: string) {
    if (!clientId) {
      return
    }
    setError(null)
    try {
      await api(`/api/admin/clients/${clientId}/exercises/${assignmentId}`, { method: 'DELETE' })
      setAssigned((current) => current.filter((item) => item.id !== assignmentId))
      if (editingId === assignmentId) {
        setEditingId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido quitar.')
    }
  }

  function startEdit(item: Assigned) {
    setEditingId(item.id)
    setEditWeekday(item.weekday)
    setEditSets(item.sets != null ? String(item.sets) : '')
    setEditReps(item.reps ?? '')
    setEditDoseUnit(item.doseUnit ?? 'repetitions')
    setEditRest(item.restSeconds != null ? String(item.restSeconds) : '')
    setEditNotes(item.notes ?? '')
    setError(null)
    setNotice(null)
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!clientId || !editingId) return
    setSavingEdit(true)
    setError(null)
    setNotice(null)
    try {
      const result = await api<ClientPlan>(
        `/api/admin/clients/${clientId}/exercises/${editingId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            weekday: editWeekday,
            sets: editSets ? Number(editSets) : null,
            reps: editReps,
            doseUnit: editDoseUnit,
            restSeconds: editRest ? Number(editRest) : null,
            notes: editNotes,
          }),
        },
      )
      setAssigned(result.exercises)
      setWeekStart(result.weekStart)
      setEditingId(null)
      setNotice('Dosis actualizada solo para este cliente.')
      setViewDay(editWeekday)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido actualizar.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <section>
      <p className="max-w-lg text-ink-soft">
        Elige a quién entrenas y arma la semana. El seguimiento (hecho / no hecho) se guarda en base de
        datos y se reinicia cada lunes.
      </p>
      {error ? (
        <p className="mt-4 text-ember" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 text-paper" role="status">
          {notice}
        </p>
      ) : null}

      {exercises.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-clay p-5 text-ink-soft ring-1 ring-white/10">
          Todavía no hay fichas.{' '}
          <Link to="/admin/ejercicios" className="text-ember underline-offset-4 hover:underline">
            Crea categorías y ejercicios
          </Link>{' '}
          para poder asignarlos.
        </p>
      ) : null}

      {clients.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-clay p-6 text-ink-soft ring-1 ring-white/10">
          Primero crea un cliente en la pestaña Clientes. Después podrás armarle el plan.
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr] lg:items-start lg:gap-10">
          <aside className="flex max-h-[42dvh] flex-col lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8.5rem)]">
            <p className="shrink-0 text-sm text-ink-soft">Clientes</p>
            <label className="sr-only" htmlFor="entrenar-client-search">
              Buscar cliente
            </label>
            <input
              id="entrenar-client-search"
              type="search"
              value={clientQuery}
              onChange={(event) => setClientQuery(event.target.value)}
              placeholder="Buscar…"
              className={`mt-3 shrink-0 ${fieldClass}`}
            />
            <ul className="panel-scroll mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-1.5 py-2">
              {filteredClients.length === 0 ? (
                <li className="px-1 text-sm text-ink-soft">Sin coincidencias.</li>
              ) : (
                filteredClients.map((item) => {
                  const active = item.id === clientId
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          onClientId(item.id)
                          setPicking(false)
                          setPickId('')
                          setNotice(null)
                          setViewDay('all')
                        }}
                        className={[
                          'tap w-full rounded-2xl px-4 py-3 text-left ring-1',
                          active
                            ? 'brand-fill font-medium text-ink ring-transparent'
                            : 'bg-clay text-paper ring-white/10 hover:bg-white/5',
                        ].join(' ')}
                      >
                        <span className="block truncate">{item.displayName}</span>
                        <span
                          className={[
                            'mt-1 block truncate text-sm',
                            active ? 'text-ink/70' : 'text-ink-soft',
                          ].join(' ')}
                        >
                          {item.email}
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </aside>

          <div className="flex max-h-[58dvh] flex-col lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8.5rem)]">
            {client ? (
              <>
                <div className="shrink-0 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <h3 className="font-display text-xl sm:text-2xl">Semana de {client.displayName}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="tap inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-clay px-4 text-sm ring-1 ring-white/10 disabled:opacity-60 sm:flex-none"
                        onClick={() => void onRefresh()}
                        disabled={refreshing}
                      >
                        <ArrowClockwise className="size-4" aria-hidden />
                        {refreshing ? 'Actualizando…' : 'Actualizar'}
                      </button>
                      <button
                        type="button"
                        className="tap inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-clay px-4 text-sm ring-1 ring-white/10 sm:flex-none"
                        onClick={() => {
                          setPicking((value) => !value)
                          setPickId('')
                        }}
                        disabled={exercises.length === 0}
                      >
                        <Plus className="size-4" aria-hidden />
                        {picking ? 'Cerrar' : 'Añadir'}
                      </button>
                    </div>
                  </div>

                  {assigned.length > 0 ? (
                    <p className="rounded-2xl bg-clay px-4 py-3 text-sm text-ink-soft ring-1 ring-white/10">
                      Semana del {weekStart ? formatWeekLabel(weekStart) : '…'}:{' '}
                      <span className="text-ember">{weekStats.done} hechos</span>
                      {' · '}
                      {weekStats.missed} no hechos
                      {' · '}
                      {weekStats.pending} pendientes
                      {' · '}
                      {weekStats.total} en total. Se reinicia el próximo lunes.
                    </p>
                  ) : null}

                  <div
                    role="tablist"
                    aria-label="Días de la semana"
                    aria-orientation="horizontal"
                    onKeyDown={onDayKeyDown}
                    className="scroll-strip flex w-full max-w-full gap-1 overflow-x-auto rounded-full bg-clay p-1 ring-1 ring-white/10"
                  >
                    <button
                      type="button"
                      role="tab"
                      id={`${tabsId}-all`}
                      data-day="all"
                      aria-controls={`${tabsId}-panel`}
                      tabIndex={viewDay === 'all' ? 0 : -1}
                      aria-selected={viewDay === 'all'}
                      className={[
                        'tap shrink-0 rounded-full px-3 py-2 text-sm',
                        viewDay === 'all' ? 'brand-fill font-medium text-ink' : 'text-ink-soft hover:text-paper',
                      ].join(' ')}
                      onClick={() => setViewDay('all')}
                    >
                      Toda
                    </button>
                    {WEEKDAYS.map((day) => {
                      const count = dayCounts.get(day.value) ?? 0
                      const done = dayDoneCounts.get(day.value) ?? 0
                      const active = viewDay === day.value
                      const allDone = count > 0 && done === count
                      return (
                        <button
                          key={day.value}
                          type="button"
                          role="tab"
                          id={`${tabsId}-${day.value}`}
                          data-day={day.value}
                          aria-controls={`${tabsId}-panel`}
                          tabIndex={active ? 0 : -1}
                          aria-selected={active}
                          className={[
                            'tap shrink-0 rounded-full px-3 py-2 text-sm',
                            active ? 'brand-fill font-medium text-ink' : 'text-ink-soft hover:text-paper',
                          ].join(' ')}
                          onClick={() => setViewDay(day.value)}
                        >
                          {day.short}
                          {count > 0 ? (
                            <span className={['ml-1', active ? 'text-ink/70' : 'text-ember'].join(' ')}>
                              {allDone ? '✓' : `${done}/${count}`}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${viewDay}`} tabIndex={0} className="panel-scroll mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
                  {picking ? (
                    <div className="mb-5 rounded-[1.5rem] bg-clay p-5 ring-1 ring-white/10">
                      <p className="text-sm text-ink-soft">Elige el día, el ejercicio y la dosis.</p>
                      <fieldset className="mt-4">
                        <legend className="mb-2 text-sm text-ink-soft">Día de entrenamiento</legend>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map((day) => {
                            const on = weekday === day.value
                            return (
                              <button
                                key={day.value}
                                type="button"
                                aria-pressed={on}
                                className={[
                                  'tap rounded-full px-3 py-1.5 text-sm ring-1',
                                  on
                                    ? 'brand-fill font-medium text-ink ring-transparent'
                                    : 'bg-ink text-ink-soft ring-white/10',
                                ].join(' ')}
                                onClick={() => setWeekday(day.value)}
                              >
                                {day.label}
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={[
                            'tap rounded-full px-3 py-1.5 text-sm ring-1',
                            filterCategory === 'all'
                              ? 'brand-fill text-ink ring-transparent'
                              : 'bg-ink text-ink-soft ring-white/10',
                          ].join(' ')}
                          onClick={() => setFilterCategory('all')}
                        >
                          Todas
                        </button>
                        {categories.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={[
                              'tap rounded-full px-3 py-1.5 text-sm ring-1',
                              filterCategory === item.id
                                ? 'brand-fill text-ink ring-transparent'
                                : 'bg-ink text-ink-soft ring-white/10',
                            ].join(' ')}
                            onClick={() => setFilterCategory(item.id)}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {filtered.map((item) => {
                          const selected = item.id === pickId
                          const onDay = assigned.some((a) => a.exerciseId === item.id && a.weekday === weekday)
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setPickId(item.id)}
                                className={[
                                  'tap w-full rounded-xl px-3 py-3 text-left text-sm ring-1',
                                  selected ? 'bg-ink ring-ember' : 'bg-ink/50 ring-white/10 hover:ring-white/25',
                                ].join(' ')}
                              >
                                <span className="font-medium">{item.name}</span>
                                <span className="mt-1 block text-ink-soft">
                                  {item.categoryName}
                                  {onDay ? ` · ya el ${weekdayLabel(weekday).toLowerCase()}` : ''}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                      {pick ? (
                        <form className="mt-5 grid gap-3 sm:grid-cols-3" onSubmit={onAssign}>
                          <p className="sm:col-span-3 text-sm">
                            {weekdayLabel(weekday)} · <span className="text-paper">{pick.name}</span>
                          </p>
                          <div>
                            <label htmlFor="dose-sets" className="mb-1 block text-sm text-ink-soft">
                              Series
                            </label>
                            <input
                              id="dose-sets"
                              type="number"
                              min={1}
                              max={20}
                              value={sets}
                              onChange={(event) => setSets(event.target.value)}
                              className={fieldClass}
                            />
                          </div>
                          <div>
                            <label htmlFor="dose-reps" className="mb-1 block text-sm text-ink-soft">
                              Dosis
                            </label>
                            <input
                              id="dose-reps"
                              value={reps}
                              onChange={(event) => setReps(event.target.value)}
                              className={fieldClass}
                            />
                            <label htmlFor="dose-unit" className="mt-2 block text-sm text-ink-soft">Unidad</label>
                            <select id="dose-unit" value={doseUnit} onChange={(event) => setDoseUnit(event.target.value as DoseUnit)} className={fieldClass}>
                              {DOSE_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="dose-rest" className="mb-1 block text-sm text-ink-soft">
                              Descanso (s)
                            </label>
                            <input
                              id="dose-rest"
                              type="number"
                              min={0}
                              max={600}
                              value={rest}
                              onChange={(event) => setRest(event.target.value)}
                              className={fieldClass}
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label htmlFor="dose-notes" className="mb-1 block text-sm text-ink-soft">
                              Nota para el cliente
                            </label>
                            <input
                              id="dose-notes"
                              value={notes}
                              onChange={(event) => setNotes(event.target.value)}
                              className={fieldClass}
                            />
                          </div>
                          <button
                            type="submit"
                            className="tap min-h-11 rounded-full brand-fill px-6 text-sm font-medium text-ink sm:col-span-3 sm:w-fit"
                          >
                            Añadir al {weekdayLabel(weekday).toLowerCase()}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}

                  {assigned.length === 0 ? (
                    <p className="text-ink-soft">
                      Este cliente aún no tiene días de entrenamiento. Añade el primero.
                    </p>
                  ) : (
                    <SoftSwap panelKey={String(viewDay)} className="grid gap-6 py-0.5">
                      {grouped.length === 0 ? (
                        <p className="text-ink-soft">
                          {viewDay === 'all'
                            ? 'Sin ejercicios.'
                            : `${weekdayLabel(viewDay)} es descanso: no hay ejercicios ese día.`}
                        </p>
                      ) : (
                        grouped.map(({ day, items }) => (
                          <div key={day.value}>
                            {viewDay === 'all' ? (
                              <h4 className="mb-3 font-display text-xl">
                                {day.label}
                                <span className="ml-2 text-sm font-sans text-ink-soft">
                                  {items.filter((item) => item.completionStatus === 'done').length}/
                                  {items.length}
                                </span>
                              </h4>
                            ) : null}
                            <ul className="grid gap-3">
                              {items.map((item) => {
                                const editing = editingId === item.id
                                return (
                                  <li
                                    key={item.id}
                                    className={[
                                      'rounded-2xl bg-clay p-5 ring-1',
                                      item.completionStatus === 'done'
                                        ? 'ring-ember/40'
                                        : item.completionStatus === 'missed'
                                          ? 'ring-white/20'
                                          : 'ring-white/10',
                                    ].join(' ')}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-medium">{item.exercise.name}</p>
                                        <p className="mt-1 text-sm text-ink-soft">
                                          {item.exercise.categoryName} · {dose(item)}
                                        </p>
                                        <p
                                          className={[
                                            'mt-2 text-sm font-medium',
                                            item.completionStatus === 'done'
                                              ? 'text-ember'
                                              : item.completionStatus === 'missed'
                                                ? 'text-ink-soft'
                                                : 'text-ink-soft',
                                          ].join(' ')}
                                        >
                                          {completionLabel(item.completionStatus)}
                                        </p>
                                        {!editing && item.notes ? (
                                          <p className="mt-2 text-sm text-paper/80">{item.notes}</p>
                                        ) : null}
                                      </div>
                                      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row">
                                        <button
                                          type="button"
                                          className="tap inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ember"
                                          aria-expanded={editing}
                                          aria-label={
                                            editing
                                              ? `Cerrar edición de ${item.exercise.name}`
                                              : `Editar dosis de ${item.exercise.name}`
                                          }
                                          onClick={() =>
                                            editing ? setEditingId(null) : startEdit(item)
                                          }
                                        >
                                          <PencilSimple className="size-4" aria-hidden />
                                          {editing ? 'Cerrar' : 'Dosis'}
                                        </button>
                                        <button
                                          type="button"
                                          className="tap inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ember"
                                          aria-label={`Quitar ${item.exercise.name}`}
                                          onClick={() => void onUnassign(item.id)}
                                        >
                                          <Trash className="size-4" aria-hidden />
                                          Quitar
                                        </button>
                                      </div>
                                    </div>
                                    {editing ? (
                                      <form
                                        className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3"
                                        onSubmit={onSaveEdit}
                                      >
                                        <p className="sm:col-span-3 text-sm text-ink-soft">
                                          Solo cambia el plan de este cliente. La ficha de la biblioteca no se
                                          toca.
                                        </p>
                                        <fieldset className="sm:col-span-3">
                                          <legend className="mb-2 text-sm text-ink-soft">Día</legend>
                                          <div className="flex flex-wrap gap-2">
                                            {WEEKDAYS.map((day) => {
                                              const on = editWeekday === day.value
                                              return (
                                                <button
                                                  key={day.value}
                                                  type="button"
                                                  aria-pressed={on}
                                                  className={[
                                                    'tap rounded-full px-3 py-1.5 text-sm ring-1',
                                                    on
                                                      ? 'brand-fill font-medium text-ink ring-transparent'
                                                      : 'bg-ink text-ink-soft ring-white/10',
                                                  ].join(' ')}
                                                  onClick={() => setEditWeekday(day.value)}
                                                >
                                                  {day.short}
                                                </button>
                                              )
                                            })}
                                          </div>
                                        </fieldset>
                                        <div>
                                          <label
                                            htmlFor={`edit-sets-${item.id}`}
                                            className="mb-1 block text-sm text-ink-soft"
                                          >
                                            Series
                                          </label>
                                          <input
                                            id={`edit-sets-${item.id}`}
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={editSets}
                                            onChange={(event) => setEditSets(event.target.value)}
                                            className={fieldClass}
                                          />
                                        </div>
                                        <div>
                                          <label
                                            htmlFor={`edit-reps-${item.id}`}
                                            className="mb-1 block text-sm text-ink-soft"
                                          >
                                            Dosis
                                          </label>
                                          <input
                                            id={`edit-reps-${item.id}`}
                                            value={editReps}
                                            onChange={(event) => setEditReps(event.target.value)}
                                            className={fieldClass}
                                          />
                                          <label htmlFor={`edit-unit-${item.id}`} className="mt-2 block text-sm text-ink-soft">Unidad</label>
                                          <select id={`edit-unit-${item.id}`} value={editDoseUnit} onChange={(event) => setEditDoseUnit(event.target.value as DoseUnit)} className={fieldClass}>
                                            {DOSE_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label
                                            htmlFor={`edit-rest-${item.id}`}
                                            className="mb-1 block text-sm text-ink-soft"
                                          >
                                            Descanso (s)
                                          </label>
                                          <input
                                            id={`edit-rest-${item.id}`}
                                            type="number"
                                            min={0}
                                            max={600}
                                            value={editRest}
                                            onChange={(event) => setEditRest(event.target.value)}
                                            className={fieldClass}
                                          />
                                        </div>
                                        <div className="sm:col-span-3">
                                          <label
                                            htmlFor={`edit-notes-${item.id}`}
                                            className="mb-1 block text-sm text-ink-soft"
                                          >
                                            Nota
                                          </label>
                                          <input
                                            id={`edit-notes-${item.id}`}
                                            value={editNotes}
                                            onChange={(event) => setEditNotes(event.target.value)}
                                            className={fieldClass}
                                          />
                                        </div>
                                        <button
                                          type="submit"
                                          disabled={savingEdit}
                                          className="tap min-h-11 rounded-full brand-fill px-6 text-sm font-medium text-ink disabled:opacity-60 sm:col-span-3 sm:w-fit"
                                        >
                                          {savingEdit ? 'Guardando…' : 'Guardar dosis'}
                                        </button>
                                      </form>
                                    ) : null}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))
                      )}
                    </SoftSwap>
                  )}
                </div>
              </>
            ) : (
              <p className="text-ink-soft">Selecciona un cliente a la izquierda.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
