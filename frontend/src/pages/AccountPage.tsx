import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useAuth } from '../auth-context'
import { api } from '../api'
import { SoftSwap, Stagger, StaggerItem } from '../components/Reveal'
import { WEEKDAYS, todayWeekday, type Weekday, weekdayLabel } from '../weekdays'

type CompletionStatus = 'done' | 'missed' | null

type AssignedExercise = {
  id: string
  exerciseId: string
  weekday: Weekday
  sets: number | null
  reps: string | null
  restSeconds: number | null
  notes: string | null
  completionStatus: CompletionStatus
  completedOn: string | null
  exercise: {
    name: string
    description: string | null
    categoryName?: string
    muscleGroup: string
    equipment: string
    cues: string | null
    videoUrl: string | null
    difficulty?: string | null
    primaryMuscles?: string | null
    setup?: string | null
    mistakes?: string | null
    tempo?: string | null
  }
}

const MUSCLE: Record<string, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  piernas: 'Piernas',
  hombros: 'Hombros',
  brazos: 'Brazos',
  core: 'Core',
  cardio: 'Cardio',
  cuerpo_completo: 'Cuerpo completo',
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink px-1.5 py-3 text-center ring-1 ring-white/10 sm:px-2">
      <dt className="text-[10px] text-ink-soft sm:text-xs">{label}</dt>
      <dd className="mt-1 font-display text-xl sm:text-2xl">{value}</dd>
    </div>
  )
}

export function AccountPage() {
  const auth = useAuth()
  const user = auth.user
  const [exercises, setExercises] = useState<AssignedExercise[] | null>(null)
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Weekday>(todayWeekday)
  const tabRefs = useRef<Map<Weekday, HTMLButtonElement>>(new Map())
  const focusTabs = useRef(false)

  useEffect(() => {
    setSelectedDay(todayWeekday())
    void api<{ weekStart: string; exercises: AssignedExercise[] }>('/api/account/exercises')
      .then((data) => {
        setExercises(data.exercises)
        setWeekStart(data.weekStart)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se han podido cargar los ejercicios.')
        setExercises([])
      })
  }, [])

  useEffect(() => {
    if (!focusTabs.current) return
    tabRefs.current.get(selectedDay)?.focus()
    focusTabs.current = false
  }, [selectedDay])

  function selectDay(day: Weekday, fromKeyboard = false) {
    if (fromKeyboard) focusTabs.current = true
    setSelectedDay(day)
  }

  function onTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = WEEKDAYS.findIndex((day) => day.value === selectedDay)
    if (index < 0) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      selectDay(WEEKDAYS[(index + 1) % WEEKDAYS.length].value, true)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      selectDay(WEEKDAYS[(index - 1 + WEEKDAYS.length) % WEEKDAYS.length].value, true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      selectDay(WEEKDAYS[0].value, true)
    } else if (event.key === 'End') {
      event.preventDefault()
      selectDay(WEEKDAYS[WEEKDAYS.length - 1].value, true)
    }
  }

  const dayCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const item of exercises ?? []) {
      counts.set(item.weekday, (counts.get(item.weekday) ?? 0) + 1)
    }
    return counts
  }, [exercises])

  const dayDoneCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const item of exercises ?? []) {
      if (item.completionStatus === 'done') {
        counts.set(item.weekday, (counts.get(item.weekday) ?? 0) + 1)
      }
    }
    return counts
  }, [exercises])

  const dayExercises = useMemo(() => {
    return (exercises ?? []).filter((item) => item.weekday === selectedDay)
  }, [exercises, selectedDay])

  const dayDone = dayExercises.filter((item) => item.completionStatus === 'done').length
  const dayMissed = dayExercises.filter((item) => item.completionStatus === 'missed').length

  const panelKey =
    exercises === null ? 'loading' : exercises.length === 0 ? 'empty' : `day-${selectedDay}`

  async function setCompletion(assignmentId: string, next: CompletionStatus) {
    const current = exercises?.find((item) => item.id === assignmentId)
    const status = current?.completionStatus === next ? null : next
    setSavingId(assignmentId)
    setError(null)
    try {
      const result = await api<{ weekStart: string; exercises: AssignedExercise[] }>(
        `/api/account/exercises/${assignmentId}/completion`,
        {
          method: 'PUT',
          body: JSON.stringify({ status }),
        },
      )
      setExercises(result.exercises)
      setWeekStart(result.weekStart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido guardar.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      <header>
        <p className="text-[11px] tracking-[0.22em] text-ink-soft">cliente</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl">Tu plan</h1>
        <p className="mt-4 max-w-md text-sm text-ink-soft sm:text-base">
          Hola, {user?.displayName}. Marca lo que hiciste esta semana
          {weekStart
            ? ` (desde el ${new Date(`${weekStart}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`
            : ''}
          . Se guarda y se reinicia cada lunes.
        </p>
      </header>

      <section className="mt-10 sm:mt-12">
        {error ? (
          <p className="mb-6 text-ember" role="alert">
            {error}
          </p>
        ) : null}

        {exercises !== null && exercises.length > 0 ? (
          <div
            role="tablist"
            aria-label="Semana de entrenamiento"
            aria-orientation="horizontal"
            onKeyDown={onTabListKeyDown}
            className="scroll-strip flex w-full gap-1 overflow-x-auto rounded-full bg-clay p-1 ring-1 ring-white/10"
          >
            {WEEKDAYS.map((day) => {
              const count = dayCounts.get(day.value) ?? 0
              const done = dayDoneCounts.get(day.value) ?? 0
              const active = selectedDay === day.value
              const isToday = day.value === todayWeekday()
              const allDone = count > 0 && done === count
              return (
                <button
                  key={day.value}
                  ref={(node) => {
                    if (node) tabRefs.current.set(day.value, node)
                    else tabRefs.current.delete(day.value)
                  }}
                  type="button"
                  role="tab"
                  id={`plan-tab-${day.value}`}
                  aria-controls={`plan-panel-${day.value}`}
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  className={[
                    'tap relative flex min-h-12 min-w-[2.75rem] flex-1 flex-col items-center justify-center rounded-full px-1.5 text-xs sm:min-h-14 sm:min-w-[3.25rem] sm:px-2 sm:text-sm',
                    active ? 'brand-fill font-medium text-ink' : 'text-ink-soft hover:text-paper',
                  ].join(' ')}
                  onClick={() => selectDay(day.value)}
                >
                  <span>{day.short}</span>
                  <span
                    className={[
                      'mt-0.5 text-xs',
                      active ? 'text-ink/70' : allDone ? 'text-ember' : count ? 'text-ember' : 'text-ink-soft/60',
                    ].join(' ')}
                  >
                    {count > 0 ? (allDone ? '✓' : `${done}/${count}`) : '—'}
                  </span>
                  {isToday && !active ? (
                    <span className="absolute bottom-1 size-1 rounded-full bg-ember" aria-hidden />
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : null}

        <div
          className="mt-8"
          role={exercises !== null && exercises.length > 0 ? 'tabpanel' : undefined}
          id={exercises !== null && exercises.length > 0 ? `plan-panel-${selectedDay}` : undefined}
          aria-labelledby={
            exercises !== null && exercises.length > 0 ? `plan-tab-${selectedDay}` : undefined
          }
        >
          <SoftSwap panelKey={panelKey}>
            {exercises === null ? (
              <p className="text-ink-soft">Cargando tu plan…</p>
            ) : exercises.length === 0 ? (
              <p className="rounded-[1.5rem] bg-clay p-6 text-ink-soft ring-1 ring-white/10">
                Todavía no tienes ejercicios. Cuando el estudio te asigne la semana, aparecerá aquí.
              </p>
            ) : dayExercises.length === 0 ? (
              <div className="rounded-[1.5rem] bg-clay p-8 text-center ring-1 ring-white/10">
                <p className="font-display text-3xl">{weekdayLabel(selectedDay)}</p>
                <p className="mt-3 text-ink-soft">Día de descanso. No hay sesión programada.</p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl sm:text-3xl">{weekdayLabel(selectedDay)}</h2>
                <p className="mt-2 text-sm text-ink-soft sm:text-base">
                  {dayDone}/{dayExercises.length} hechos
                  {dayMissed > 0 ? ` · ${dayMissed} no hechos` : ''}
                </p>
                <Stagger as="ol" className="mt-6 grid gap-4 sm:gap-5">
                  {dayExercises.map((item, index) => {
                    const group =
                      item.exercise.categoryName ??
                      MUSCLE[item.exercise.muscleGroup] ??
                      item.exercise.muscleGroup
                    const done = item.completionStatus === 'done'
                    const missed = item.completionStatus === 'missed'
                    const busy = savingId === item.id
                    return (
                      <StaggerItem
                        as="li"
                        key={item.id}
                        className={[
                          'rounded-[1.25rem] bg-clay p-4 ring-1 sm:rounded-[1.5rem] sm:p-6',
                          done ? 'ring-ember/40' : missed ? 'ring-white/20 opacity-80' : 'ring-white/10',
                        ].join(' ')}
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-sm text-ink-soft">
                            <span className="font-display text-ember">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="mx-2 text-white/20">·</span>
                            {group}
                          </p>
                          {done ? (
                            <p className="text-xs tracking-wide text-ember uppercase">Hecho</p>
                          ) : missed ? (
                            <p className="text-xs tracking-wide text-ink-soft uppercase">No hecho</p>
                          ) : (
                            <p className="text-xs tracking-wide text-ink-soft/70 uppercase">Pendiente</p>
                          )}
                        </div>

                        <h3 className="mt-2 font-display text-2xl sm:text-3xl">{item.exercise.name}</h3>

                        <dl className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                          <Metric label="Series" value={item.sets != null ? String(item.sets) : '—'} />
                          <Metric label="Reps" value={item.reps ?? '—'} />
                          <Metric
                            label="Descanso"
                            value={item.restSeconds != null ? `${item.restSeconds}s` : '—'}
                          />
                        </dl>

                        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          <button
                            type="button"
                            disabled={busy}
                            aria-pressed={done}
                            className={[
                              'tap min-h-11 rounded-full px-4 text-sm ring-1 disabled:opacity-60 sm:px-5',
                              done
                                ? 'brand-fill font-medium text-ink ring-transparent'
                                : 'bg-ink text-ink-soft ring-white/10 hover:text-paper',
                            ].join(' ')}
                            onClick={() => void setCompletion(item.id, 'done')}
                          >
                            Lo hice
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            aria-pressed={missed}
                            className={[
                              'tap min-h-11 rounded-full px-4 text-sm ring-1 disabled:opacity-60 sm:px-5',
                              missed
                                ? 'bg-paper/15 font-medium text-paper ring-white/25'
                                : 'bg-ink text-ink-soft ring-white/10 hover:text-paper',
                            ].join(' ')}
                            onClick={() => void setCompletion(item.id, 'missed')}
                          >
                            No lo hice
                          </button>
                        </div>

                        {item.notes ? (
                          <p className="mt-5 rounded-2xl bg-ink/70 px-4 py-3 text-sm ring-1 ring-ember/35">
                            <span className="text-ember">Nota del entrenador</span>
                            <span className="mt-1 block text-paper/90">{item.notes}</span>
                          </p>
                        ) : null}

                        {item.exercise.setup ? (
                          <p className="mt-4 text-sm text-paper/80">{item.exercise.setup}</p>
                        ) : null}
                        {item.exercise.description ? (
                          <p className="mt-3 text-paper/80">{item.exercise.description}</p>
                        ) : null}
                        {item.exercise.cues ? (
                          <p className="mt-2 text-sm text-ink-soft">{item.exercise.cues}</p>
                        ) : null}
                        {item.exercise.mistakes ? (
                          <p className="mt-2 text-sm text-ink-soft">Evita: {item.exercise.mistakes}</p>
                        ) : null}
                        {item.exercise.tempo ? (
                          <p className="mt-2 text-sm text-ink-soft">Tempo {item.exercise.tempo}</p>
                        ) : null}
                        {item.exercise.primaryMuscles ? (
                          <p className="mt-2 text-sm text-ink-soft">{item.exercise.primaryMuscles}</p>
                        ) : null}

                        {item.exercise.videoUrl ? (
                          <a
                            href={item.exercise.videoUrl}
                            className="tap mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-ember ring-1 ring-white/10 hover:bg-white/5"
                            rel="noreferrer"
                            target="_blank"
                          >
                            Ver vídeo
                          </a>
                        ) : null}
                      </StaggerItem>
                    )
                  })}
                </Stagger>
              </>
            )}
          </SoftSwap>
        </div>
      </section>
    </main>
  )
}
