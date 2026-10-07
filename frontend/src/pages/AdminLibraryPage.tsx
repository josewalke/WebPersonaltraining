import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { api } from '../api'
import { Modal } from '../components/Modal'

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
  difficulty: string | null
  primaryMuscles: string | null
  setup: string | null
  mistakes: string | null
  tempo: string | null
}

const EQUIPMENT = [
  { value: 'peso_corporal', label: 'Peso corporal' },
  { value: 'barra', label: 'Barra' },
  { value: 'mancuernas', label: 'Mancuernas' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'banco', label: 'Banco' },
  { value: 'maquina', label: 'Máquina' },
  { value: 'banda', label: 'Banda' },
  { value: 'otro', label: 'Otro' },
] as const

const DIFFICULTY = [
  { value: '', label: 'Sin indicar' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const

const fieldClass =
  'w-full rounded-2xl border-0 bg-ink px-4 py-3 text-paper ring-1 ring-white/15 focus-visible:ring-2 focus-visible:ring-ember'

function equipmentLabel(value: string) {
  return EQUIPMENT.find((item) => item.value === value)?.label ?? value
}

function difficultyLabel(value: string | null) {
  if (!value) {
    return null
  }
  return DIFFICULTY.find((item) => item.value === value)?.label ?? value
}

type FormState = {
  name: string
  categoryId: string
  equipment: string
  difficulty: string
  primaryMuscles: string
  setup: string
  description: string
  cues: string
  mistakes: string
  tempo: string
  videoUrl: string
}

const emptyForm: FormState = {
  name: '',
  categoryId: '',
  equipment: 'peso_corporal',
  difficulty: '',
  primaryMuscles: '',
  setup: '',
  description: '',
  cues: '',
  mistakes: '',
  tempo: '',
  videoUrl: '',
}

function formFromExercise(item: Exercise): FormState {
  return {
    name: item.name,
    categoryId: item.categoryId,
    equipment: item.equipment,
    difficulty: item.difficulty ?? '',
    primaryMuscles: item.primaryMuscles ?? '',
    setup: item.setup ?? '',
    description: item.description ?? '',
    cues: item.cues ?? '',
    mistakes: item.mistakes ?? '',
    tempo: item.tempo ?? '',
    videoUrl: item.videoUrl ?? '',
  }
}

export function AdminLibraryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [categoryId, setCategoryId] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return exercises.filter((item) => {
      if (categoryId !== 'all' && item.categoryId !== categoryId) return false
      if (equipmentFilter !== 'all' && item.equipment !== equipmentFilter) return false
      if (difficultyFilter !== 'all' && (item.difficulty ?? '') !== difficultyFilter) return false
      if (!needle) return true
      return (
        item.name.toLowerCase().includes(needle) ||
        item.categoryName.toLowerCase().includes(needle) ||
        (item.primaryMuscles ?? '').toLowerCase().includes(needle)
      )
    })
  }, [categoryId, difficultyFilter, equipmentFilter, exercises, query])

  async function load() {
    const data = await api<{ exercises: Exercise[]; categories: Category[] }>('/api/admin/exercises')
    setExercises(data.exercises)
    setCategories(data.categories)
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || data.categories[0]?.id || '',
    }))
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'No se ha podido cargar la biblioteca.')
    })
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openNew() {
    setEditingId(null)
    setForm({
      ...emptyForm,
      categoryId: categoryId !== 'all' ? categoryId : categories[0]?.id ?? '',
    })
    setShowForm(true)
    setNotice(null)
    setError(null)
  }

  function openEdit(item: Exercise) {
    setEditingId(item.id)
    setForm(formFromExercise(item))
    setShowForm(true)
    setNotice(null)
    setError(null)
  }

  async function onSaveExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setSaving(true)
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      equipment: form.equipment,
      difficulty: form.difficulty,
      primaryMuscles: form.primaryMuscles,
      setup: form.setup,
      description: form.description,
      cues: form.cues,
      mistakes: form.mistakes,
      tempo: form.tempo,
      videoUrl: form.videoUrl,
    }
    try {
      if (editingId) {
        await api(`/api/admin/exercises/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setNotice('Ejercicio actualizado.')
      } else {
        await api('/api/admin/exercises', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setNotice('Ejercicio creado.')
      }
      setShowForm(false)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido guardar el ejercicio.')
    } finally {
      setSaving(false)
    }
  }

  async function onRemoveExercise(id: string, name: string) {
    const ok = window.confirm(
      `¿Eliminar «${name}» de la biblioteca?\n\nDejará de aparecer al asignar planes. Los clientes que ya lo tengan en su plan seguirán viéndolo hasta que lo quites ahí.`,
    )
    if (!ok) {
      return
    }
    setError(null)
    try {
      await api(`/api/admin/exercises/${id}`, { method: 'DELETE' })
      setExercises((current) => current.filter((item) => item.id !== id))
      if (editingId === id) {
        setShowForm(false)
        setEditingId(null)
      }
      setNotice('Ejercicio eliminado de la biblioteca.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido eliminar.')
    }
  }

  async function onSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    const data = new FormData(event.currentTarget)
    const body = {
      name: String(data.get('name') ?? ''),
    }
    try {
      if (editingCategory) {
        await api(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        setNotice('Categoría actualizada.')
      } else {
        await api('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        setNotice('Categoría creada.')
      }
      setShowCategoryForm(false)
      setEditingCategory(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido guardar la categoría.')
    }
  }

  async function onRemoveCategory(id: string, name: string) {
    const ok = window.confirm(
      `¿Eliminar la categoría «${name}»?\n\nSolo se puede si no tiene ejercicios activos. Desaparece de la lista al crear fichas.`,
    )
    if (!ok) {
      return
    }
    setError(null)
    try {
      await api(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (categoryId === id) {
        setCategoryId('all')
      }
      setNotice('Categoría eliminada.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido eliminar la categoría.')
    }
  }

  return (
    <>
      {error ? (
        <p className="mb-6 text-ember" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-6 text-paper" role="status">
          {notice}
        </p>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[18rem_1fr] lg:items-start lg:gap-10">
        <aside className="flex max-h-[42dvh] flex-col lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8.5rem)]">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <h2 className="font-display text-xl sm:text-2xl">Categorías</h2>
            <button
              type="button"
              className="tap inline-flex min-h-10 items-center gap-1 rounded-full bg-clay px-3 text-sm ring-1 ring-white/10"
              onClick={() => {
                setEditingCategory(null)
                setShowCategoryForm(true)
              }}
            >
              <Plus className="size-4" aria-hidden />
              Nueva
            </button>
          </div>
          <ul className="panel-scroll mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-1.5 py-2">
            <li>
              <button
                type="button"
                aria-pressed={categoryId === 'all'}
                onClick={() => setCategoryId('all')}
                className={[
                  'tap flex min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm ring-1',
                  categoryId === 'all'
                    ? 'brand-fill font-medium text-ink ring-transparent'
                    : 'bg-clay text-paper ring-white/10 hover:bg-white/5',
                ].join(' ')}
              >
                <span>Todas</span>
                <span className={categoryId === 'all' ? 'text-ink/70' : 'text-ink-soft'}>{exercises.length}</span>
              </button>
            </li>
            {categories.map((item) => {
              const active = categoryId === item.id
              return (
                <li
                  key={item.id}
                  className={[
                    'flex min-h-12 overflow-hidden rounded-2xl ring-1',
                    active ? 'brand-fill ring-transparent' : 'bg-clay ring-white/10',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategoryId(item.id)}
                    className={[
                      'tap min-w-0 flex-1 px-4 py-3 text-left text-sm',
                      active ? 'font-medium text-ink' : 'text-paper hover:bg-white/5',
                    ].join(' ')}
                  >
                    <span className="block truncate">{item.name}</span>
                    <span className={['mt-0.5 block text-xs', active ? 'text-ink/70' : 'text-ink-soft'].join(' ')}>
                      {item.exerciseCount === 1 ? '1 ejercicio' : `${item.exerciseCount} ejercicios`}
                    </span>
                  </button>
                  <div
                    className={[
                      'flex shrink-0 self-stretch border-l',
                      active ? 'border-ink/15' : 'border-white/10',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      className={[
                        'tap grid w-12 place-items-center self-stretch',
                        active ? 'text-ink/80 hover:bg-ink/10' : 'text-ink-soft hover:bg-white/5 hover:text-paper',
                      ].join(' ')}
                      aria-label={`Editar ${item.name}`}
                      onClick={() => {
                        setEditingCategory(item)
                        setShowCategoryForm(true)
                      }}
                    >
                      <PencilSimple className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={[
                        'tap grid w-12 place-items-center self-stretch rounded-r-2xl',
                        active
                          ? 'text-ink/80 hover:bg-ink/10'
                          : 'text-ink-soft hover:bg-white/5 hover:text-ember',
                      ].join(' ')}
                      aria-label={`Eliminar ${item.name}`}
                      title="Eliminar categoría"
                      onClick={() => void onRemoveCategory(item.id, item.name)}
                    >
                      <Trash className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="flex max-h-[58dvh] flex-col lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8.5rem)]">
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h2 className="font-display text-xl sm:text-2xl">Fichas</h2>
            <button
              type="button"
              disabled={categories.length === 0}
              className="tap inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full brand-fill px-5 text-sm font-medium text-ink disabled:opacity-50 sm:w-auto"
              onClick={openNew}
            >
              <Plus className="size-4" aria-hidden />
              Nuevo ejercicio
            </button>
          </div>
          <div className="mt-3 grid shrink-0 gap-2 sm:grid-cols-[1fr_auto_auto]">
            <label className="sr-only" htmlFor="library-search">
              Buscar ejercicio
            </label>
            <input
              id="library-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre…"
              className={fieldClass}
            />
            <select
              aria-label="Filtrar por material"
              value={equipmentFilter}
              onChange={(event) => setEquipmentFilter(event.target.value)}
              className={fieldClass}
            >
              <option value="all">Todo el material</option>
              {EQUIPMENT.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por nivel"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className={fieldClass}
            >
              <option value="all">Todos los niveles</option>
              {DIFFICULTY.filter((item) => item.value).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="panel-scroll mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
            {categories.length === 0 ? (
              <p className="rounded-2xl bg-clay p-5 text-ink-soft ring-1 ring-white/10">
                Crea primero una categoría.
              </p>
            ) : null}

            {visible.length === 0 ? (
              categories.length > 0 ? (
                <p className="text-ink-soft">
                  {query || equipmentFilter !== 'all' || difficultyFilter !== 'all'
                    ? 'Ninguna ficha coincide con la búsqueda.'
                    : 'No hay ejercicios en esta categoría.'}
                </p>
              ) : null
            ) : (
              <ul className="grid gap-4">
                {visible.map((item) => (
                  <li key={item.id} className="rounded-[1.5rem] bg-clay p-5 ring-1 ring-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl">{item.name}</p>
                        <p className="mt-1 text-sm text-ink-soft">
                          {item.categoryName} · {equipmentLabel(item.equipment)}
                          {difficultyLabel(item.difficulty) ? ` · ${difficultyLabel(item.difficulty)}` : ''}
                        </p>
                        {item.primaryMuscles ? (
                          <p className="mt-1 text-sm text-ink-soft">{item.primaryMuscles}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="tap rounded-full bg-ink px-3 py-2 text-sm ring-1 ring-white/10"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => openEdit(item)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="tap rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ember"
                          aria-label={`Eliminar ${item.name}`}
                          onClick={() => void onRemoveExercise(item.id, item.name)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {item.setup ? <p className="mt-3 text-sm text-paper/80">Montaje: {item.setup}</p> : null}
                    {item.description ? <p className="mt-2 text-sm text-paper/80">{item.description}</p> : null}
                    {item.cues ? <p className="mt-2 text-sm text-ink-soft">{item.cues}</p> : null}
                    {item.mistakes ? <p className="mt-2 text-sm text-ink-soft">Errores: {item.mistakes}</p> : null}
                    {item.tempo ? <p className="mt-2 text-sm text-ink-soft">Tempo {item.tempo}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={showCategoryForm}
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
        onClose={() => {
          setShowCategoryForm(false)
          setEditingCategory(null)
        }}
      >
        <form className="grid gap-4" onSubmit={onSaveCategory} key={editingCategory?.id ?? 'new-category'}>
          <div>
            <label htmlFor="lib-cat-name" className="mb-1 block text-sm">
              Nombre
            </label>
            <input
              id="lib-cat-name"
              name="name"
              required
              minLength={2}
              defaultValue={editingCategory?.name ?? ''}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="tap min-h-12 rounded-full brand-fill px-6 text-sm font-medium text-ink">
              {editingCategory ? 'Guardar' : 'Crear categoría'}
            </button>
            <button
              type="button"
              className="tap min-h-12 rounded-full px-5 text-sm text-ink-soft"
              onClick={() => {
                setShowCategoryForm(false)
                setEditingCategory(null)
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showForm}
        wide
        title={editingId ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        onClose={() => {
          setShowForm(false)
          setEditingId(null)
        }}
      >
        <form className="grid gap-4" onSubmit={onSaveExercise}>
          <div>
            <label htmlFor="ex-name" className="mb-2 block text-sm">
              Nombre
            </label>
            <input
              id="ex-name"
              required
              minLength={2}
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ex-cat" className="mb-2 block text-sm">
                Categoría
              </label>
              <select
                id="ex-cat"
                required
                value={form.categoryId}
                onChange={(event) => updateField('categoryId', event.target.value)}
                className={fieldClass}
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-eq" className="mb-2 block text-sm">
                Material
              </label>
              <select
                id="ex-eq"
                required
                value={form.equipment}
                onChange={(event) => updateField('equipment', event.target.value)}
                className={fieldClass}
              >
                {EQUIPMENT.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-diff" className="mb-2 block text-sm">
                Nivel
              </label>
              <select
                id="ex-diff"
                value={form.difficulty}
                onChange={(event) => updateField('difficulty', event.target.value)}
                className={fieldClass}
              >
                {DIFFICULTY.map((item) => (
                  <option key={item.value || 'none'} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-muscles" className="mb-2 block text-sm">
                Músculos principales
              </label>
              <input
                id="ex-muscles"
                value={form.primaryMuscles}
                onChange={(event) => updateField('primaryMuscles', event.target.value)}
                placeholder="Cuádriceps, glúteo"
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="ex-setup" className="mb-2 block text-sm">
              Montaje y postura
            </label>
            <textarea
              id="ex-setup"
              rows={2}
              value={form.setup}
              onChange={(event) => updateField('setup', event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="ex-desc" className="mb-2 block text-sm">
              Cómo se hace
            </label>
            <textarea
              id="ex-desc"
              rows={3}
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="ex-cues" className="mb-2 block text-sm">
              Indicaciones
            </label>
            <textarea
              id="ex-cues"
              rows={2}
              value={form.cues}
              onChange={(event) => updateField('cues', event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="ex-mistakes" className="mb-2 block text-sm">
              Errores habituales
            </label>
            <textarea
              id="ex-mistakes"
              rows={2}
              value={form.mistakes}
              onChange={(event) => updateField('mistakes', event.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ex-tempo" className="mb-2 block text-sm">
                Tempo (opcional)
              </label>
              <input
                id="ex-tempo"
                value={form.tempo}
                onChange={(event) => updateField('tempo', event.target.value)}
                placeholder="3-1-1-0"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ex-video" className="mb-2 block text-sm">
                URL del vídeo
              </label>
              <input
                id="ex-video"
                type="url"
                value={form.videoUrl}
                onChange={(event) => updateField('videoUrl', event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="tap min-h-12 rounded-full brand-fill px-6 font-medium text-ink disabled:opacity-60"
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear ejercicio'}
            </button>
            <button
              type="button"
              className="tap min-h-12 rounded-full px-6 text-ink-soft"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
