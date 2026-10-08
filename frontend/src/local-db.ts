import type { AuthUser, Service, SiteData, Trainer } from './types'

const PREFIX = 'powerup.local.'
const KEYS = {
  site: `${PREFIX}site`,
  leads: `${PREFIX}leads`,
  clients: `${PREFIX}clients`,
  session: `${PREFIX}session`,
  exercises: `${PREFIX}exercises`,
  categories: `${PREFIX}categories`,
  plans: `${PREFIX}plans`,
} as const

export type LocalLead = {
  id: string
  fullName: string
  email: string
  phone: string | null
  preferredModality: string | null
  serviceId: string | null
  serviceName: string | null
  message: string | null
  status: string
  createdAt: string
}

export type LocalClient = {
  id: string
  email: string
  displayName: string
  isActive: boolean
  password: string
}

type LocalCategory = {
  id: string
  name: string
  slug: string
  sortOrder: number
}

type LocalExercise = {
  id: string
  name: string
  slug: string
  categoryId: string | null
  muscleGroup: string | null
  equipment: string | null
  instructions: string | null
  videoUrl: string | null
  imageUrl: string | null
  isActive: boolean
}

type LocalAssignment = {
  id: string
  clientId: string
  exerciseId: string
  weekday: number | null
  sets: number | null
  reps: string | null
  loadNote: string | null
  restSeconds: number | null
  notes: string | null
  sortOrder: number
}

const DEMO_USERS = {
  admin: {
    id: 'local-admin',
    email: 'admin@powerup.local',
    password: 'PowerUp-admin-10',
    displayName: 'Mario Vega',
    role: 'admin' as const,
  },
  client: {
    id: 'local-client',
    email: 'cliente@powerup.local',
    password: 'PowerUp-cliente-10',
    displayName: 'Ana García',
    role: 'client' as const,
  },
} as const

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return fallback
    }
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function defaultSite(): SiteData {
  const trainer: Trainer = {
    id: 'local-trainer',
    displayName: 'Power Up',
    slug: 'entrenador',
    bio: 'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online. Fuerza, técnica y hábitos: sin grupos, sin plantillas genéricas. Plazas limitadas.',
    city: 'Las Palmas de Gran Canaria',
    personName: null,
    photoUrl: '/media/trainer-bench.png',
    tagline: 'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online',
    story:
      'Trabajo sin grupos ni plantillas genéricas: cada plan se diseña para tu objetivo, tu semana y tu técnica. Presencial en Las Palmas de Gran Canaria o por videollamada, con el mismo seguimiento.',
    credentials: [],
  }

  const services: Service[] = [
    {
      id: 'svc-online',
      name: 'Entrenamiento personal online',
      slug: 'pt-online',
      modality: 'online',
      description: 'Videollamada con seguimiento de series, vídeo de técnica y ajustes semanales.',
      durationMinutes: 45,
      priceCents: 4500,
      currency: 'EUR',
    },
    {
      id: 'svc-presencial',
      name: 'Entrenamiento personal presencial',
      slug: 'pt-presencial',
      modality: 'presencial',
      description: 'Sesión presencial en Las Palmas de Gran Canaria. Técnica, carga y progresión adaptadas a ti.',
      durationMinutes: 60,
      priceCents: 5500,
      currency: 'EUR',
    },
    {
      id: 'svc-valoracion',
      name: 'Valoración inicial',
      slug: 'valoracion',
      modality: 'hibrido',
      description:
        'Primera cita: objetivos, historial, movilidad y prueba de fuerza básica. Define el plan de las primeras 4 semanas.',
      durationMinutes: 75,
      priceCents: 7000,
      currency: 'EUR',
    },
  ]

  return { trainer, services, testimonials: [] }
}

function ensureSeed() {
  if (!localStorage.getItem(KEYS.site)) {
    writeJson(KEYS.site, defaultSite())
  }
  if (!localStorage.getItem(KEYS.leads)) {
    writeJson(KEYS.leads, [])
  }
  if (!localStorage.getItem(KEYS.clients)) {
    writeJson(KEYS.clients, [
      {
        id: DEMO_USERS.client.id,
        email: DEMO_USERS.client.email,
        displayName: DEMO_USERS.client.displayName,
        isActive: true,
        password: DEMO_USERS.client.password,
      } satisfies LocalClient,
    ])
  }
  if (!localStorage.getItem(KEYS.categories)) {
    writeJson(KEYS.categories, [
      { id: 'cat-force', name: 'Fuerza', slug: 'fuerza', sortOrder: 1 },
      { id: 'cat-cardio', name: 'Cardio', slug: 'cardio', sortOrder: 2 },
    ] satisfies LocalCategory[])
  }
  if (!localStorage.getItem(KEYS.exercises)) {
    writeJson(KEYS.exercises, [
      {
        id: 'ex-squat',
        name: 'Sentadilla',
        slug: 'sentadilla',
        categoryId: 'cat-force',
        muscleGroup: 'Piernas',
        equipment: 'Barra',
        instructions: 'Pies al ancho de hombros, baja con control y sube empujando el suelo.',
        videoUrl: null,
        imageUrl: null,
        isActive: true,
      },
      {
        id: 'ex-press',
        name: 'Press banca',
        slug: 'press-banca',
        categoryId: 'cat-force',
        muscleGroup: 'Pecho',
        equipment: 'Barra',
        instructions: 'Escápulas juntas, barra al pecho y empuje vertical.',
        videoUrl: null,
        imageUrl: null,
        isActive: true,
      },
    ] satisfies LocalExercise[])
  }
  if (!localStorage.getItem(KEYS.plans)) {
    writeJson(KEYS.plans, [
      {
        id: 'asg-1',
        clientId: DEMO_USERS.client.id,
        exerciseId: 'ex-squat',
        weekday: 1,
        sets: 3,
        reps: '8-10',
        loadNote: 'RPE 7',
        restSeconds: 120,
        notes: 'Prioriza profundidad controlada.',
        sortOrder: 1,
      },
    ] satisfies LocalAssignment[])
  }
}

export function isLocalDataMode() {
  return String(import.meta.env.VITE_DATA_MODE ?? '').toLowerCase() === 'local'
}

export function getLocalSite(): SiteData {
  ensureSeed()
  return readJson(KEYS.site, defaultSite())
}

export function listLocalLeads(): LocalLead[] {
  ensureSeed()
  return readJson<LocalLead[]>(KEYS.leads, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function insertLocalLead(input: {
  serviceId: string | null
  fullName: string
  email: string
  phone: string
  preferredModality: string
  message: string
}) {
  ensureSeed()
  const site = getLocalSite()
  const service = input.serviceId
    ? site.services.find((item) => item.id === input.serviceId) ?? null
    : null
  const lead: LocalLead = {
    id: uid('lead'),
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim() || null,
    preferredModality: input.preferredModality || null,
    serviceId: service?.id ?? null,
    serviceName: service?.name ?? null,
    message: input.message.trim() || null,
    status: 'new',
    createdAt: new Date().toISOString(),
  }
  const leads = listLocalLeads()
  writeJson(KEYS.leads, [lead, ...leads])
  return { id: lead.id }
}

export function updateLocalLeadStatus(id: string, status: string) {
  const leads = listLocalLeads().map((lead) => (lead.id === id ? { ...lead, status } : lead))
  writeJson(KEYS.leads, leads)
}

export function listLocalClients() {
  ensureSeed()
  return readJson<LocalClient[]>(KEYS.clients, []).map(({ password: _password, ...client }) => client)
}

export function createLocalClient(input: { email: string; displayName: string; password: string }) {
  ensureSeed()
  const clients = readJson<LocalClient[]>(KEYS.clients, [])
  const email = input.email.trim().toLowerCase()
  if (clients.some((client) => client.email === email)) {
    throw new Error('Ya existe un cliente con ese email.')
  }
  const created: LocalClient = {
    id: uid('client'),
    email,
    displayName: input.displayName.trim(),
    isActive: true,
    password: input.password,
  }
  writeJson(KEYS.clients, [...clients, created])
  return { user: { id: created.id, email: created.email, displayName: created.displayName, role: 'client' as const } }
}

export function getLocalSession(): AuthUser | null {
  ensureSeed()
  return readJson<AuthUser | null>(KEYS.session, null)
}

export function setLocalSession(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(KEYS.session)
    return
  }
  writeJson(KEYS.session, user)
}

export function localLogin(email: string, password: string): AuthUser {
  ensureSeed()
  const normalized = email.trim().toLowerCase()
  if (normalized === DEMO_USERS.admin.email && password === DEMO_USERS.admin.password) {
    const user: AuthUser = {
      id: DEMO_USERS.admin.id,
      email: DEMO_USERS.admin.email,
      displayName: DEMO_USERS.admin.displayName,
      role: 'admin',
    }
    setLocalSession(user)
    return user
  }

  const clients = readJson<LocalClient[]>(KEYS.clients, [])
  const client = clients.find((item) => item.email === normalized && item.password === password && item.isActive)
  if (client) {
    const user: AuthUser = {
      id: client.id,
      email: client.email,
      displayName: client.displayName,
      role: 'client',
    }
    setLocalSession(user)
    return user
  }

  throw new Error('Email o contraseña incorrectos.')
}

export function localLogout() {
  setLocalSession(null)
}

export function listLocalCategories() {
  ensureSeed()
  return readJson<LocalCategory[]>(KEYS.categories, [])
}

export function listLocalExercises() {
  ensureSeed()
  return readJson<LocalExercise[]>(KEYS.exercises, [])
}

export function saveLocalExercise(exercise: LocalExercise) {
  const exercises = listLocalExercises()
  const index = exercises.findIndex((item) => item.id === exercise.id)
  if (index >= 0) {
    exercises[index] = exercise
  } else {
    exercises.push(exercise)
  }
  writeJson(KEYS.exercises, exercises)
  return exercise
}

export function deleteLocalExercise(id: string) {
  writeJson(
    KEYS.exercises,
    listLocalExercises().filter((item) => item.id !== id),
  )
}

export function saveLocalCategory(category: LocalCategory) {
  const categories = listLocalCategories()
  const index = categories.findIndex((item) => item.id === category.id)
  if (index >= 0) {
    categories[index] = category
  } else {
    categories.push(category)
  }
  writeJson(KEYS.categories, categories)
  return category
}

export function deleteLocalCategory(id: string) {
  writeJson(
    KEYS.categories,
    listLocalCategories().filter((item) => item.id !== id),
  )
}

export function listLocalAssignments(clientId: string) {
  ensureSeed()
  return readJson<LocalAssignment[]>(KEYS.plans, []).filter((item) => item.clientId === clientId)
}

export function saveLocalAssignment(assignment: LocalAssignment) {
  const plans = readJson<LocalAssignment[]>(KEYS.plans, [])
  const index = plans.findIndex((item) => item.id === assignment.id)
  if (index >= 0) {
    plans[index] = assignment
  } else {
    plans.push(assignment)
  }
  writeJson(KEYS.plans, plans)
  return assignment
}

export function deleteLocalAssignment(id: string) {
  writeJson(
    KEYS.plans,
    readJson<LocalAssignment[]>(KEYS.plans, []).filter((item) => item.id !== id),
  )
}

export function createLocalId(prefix: string) {
  return uid(prefix)
}

export { DEMO_USERS }
