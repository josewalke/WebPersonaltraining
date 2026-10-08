import { ApiError } from './api'
import {
  createLocalClient,
  createLocalId,
  deleteLocalAssignment,
  deleteLocalCategory,
  deleteLocalExercise,
  getLocalSession,
  getLocalSite,
  insertLocalLead,
  listLocalAssignments,
  listLocalCategories,
  listLocalClients,
  listLocalExercises,
  listLocalLeads,
  localLogin,
  localLogout,
  saveLocalAssignment,
  saveLocalCategory,
  saveLocalExercise,
  updateLocalLeadStatus,
} from './local-db'

function mondayIso(date = new Date()) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return copy.toISOString().slice(0, 10)
}

function parseBody(options: RequestInit): Record<string, unknown> {
  if (!options.body || typeof options.body !== 'string') {
    return {}
  }
  try {
    return JSON.parse(options.body) as Record<string, unknown>
  } catch {
    return {}
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function mapExercise(exercise: ReturnType<typeof listLocalExercises>[number], categories: ReturnType<typeof listLocalCategories>) {
  const category = categories.find((item) => item.id === exercise.categoryId)
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.instructions,
    categoryId: exercise.categoryId ?? categories[0]?.id ?? '',
    categoryName: category?.name ?? 'General',
    equipment: exercise.equipment ?? '',
    cues: exercise.instructions,
    videoUrl: exercise.videoUrl,
    muscleGroup: exercise.muscleGroup ?? '',
    slug: exercise.slug,
    isActive: exercise.isActive,
    imageUrl: exercise.imageUrl,
  }
}

function clientPlan(clientId: string) {
  const categories = listLocalCategories()
  const exercises = listLocalExercises()
  const assigned = listLocalAssignments(clientId).map((item) => {
    const exercise = exercises.find((entry) => entry.id === item.exerciseId)
    const mapped = exercise
      ? mapExercise(exercise, categories)
      : {
          id: item.exerciseId,
          name: 'Ejercicio',
          description: null,
          categoryId: '',
          categoryName: 'General',
          equipment: '',
          cues: null,
          videoUrl: null,
          muscleGroup: '',
        }
    return {
      id: item.id,
      exerciseId: item.exerciseId,
      weekday: (item.weekday ?? 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      sets: item.sets,
      reps: item.reps,
      doseUnit: 'repetitions' as const,
      restSeconds: item.restSeconds,
      notes: item.notes,
      completionStatus: null,
      completedOn: null,
      exercise: {
        ...mapped,
        muscleGroup: mapped.muscleGroup || 'cuerpo_completo',
      },
    }
  })
  const weekStart = mondayIso()
  return {
    weekStart,
    currentWeek: weekStart,
    readOnly: false,
    availableWeeks: [weekStart],
    exercises: assigned,
  }
}

function requireAdmin() {
  const session = getLocalSession()
  if (!session || session.role !== 'admin') {
    throw new ApiError('No tienes permiso para esto.', 403)
  }
  return session
}

function requireClient() {
  const session = getLocalSession()
  if (!session || session.role !== 'client') {
    throw new ApiError('No tienes permiso para esto.', 403)
  }
  return session
}

export async function localApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const url = new URL(path, 'http://local.powerup')
  const pathname = url.pathname
  const body = parseBody(options)

  await Promise.resolve()

  if (pathname === '/api/site' && method === 'GET') {
    return getLocalSite() as T
  }

  if (pathname === '/api/leads' && method === 'POST') {
    const result = insertLocalLead({
      serviceId: typeof body.serviceId === 'string' ? body.serviceId : null,
      fullName: String(body.fullName ?? ''),
      email: String(body.email ?? ''),
      phone: String(body.phone ?? ''),
      preferredModality: String(body.preferredModality ?? ''),
      message: String(body.message ?? ''),
    })
    return result as T
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    const user = getLocalSession()
    if (!user) {
      throw new ApiError('No hay sesión.', 401)
    }
    return { user } as T
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const user = localLogin(String(body.email ?? ''), String(body.password ?? ''))
      return { user } as T
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : 'No se ha podido entrar.', 401)
    }
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    localLogout()
    return {} as T
  }

  if (pathname === '/api/admin/leads' && method === 'GET') {
    requireAdmin()
    return {
      leads: listLocalLeads().map((lead) => ({
        id: lead.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        preferredModality: lead.preferredModality,
        serviceName: lead.serviceName,
        message: lead.message,
        status: lead.status,
        createdAt: lead.createdAt,
      })),
    } as T
  }

  const leadMatch = pathname.match(/^\/api\/admin\/leads\/([^/]+)$/)
  if (leadMatch && method === 'PATCH') {
    requireAdmin()
    updateLocalLeadStatus(leadMatch[1], String(body.status ?? 'new'))
    return {} as T
  }

  if (pathname === '/api/admin/clients' && method === 'GET') {
    requireAdmin()
    return { clients: listLocalClients() } as T
  }

  if (pathname === '/api/admin/clients' && method === 'POST') {
    requireAdmin()
    try {
      return createLocalClient({
        email: String(body.email ?? ''),
        displayName: String(body.displayName ?? ''),
        password: String(body.password ?? 'PowerUp-cliente-10'),
      }) as T
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : 'No se ha podido crear el cliente.', 400)
    }
  }

  if (pathname === '/api/admin/exercises' && method === 'GET') {
    requireAdmin()
    const categories = listLocalCategories()
    const exercises = listLocalExercises().map((exercise) => mapExercise(exercise, categories))
    return {
      exercises,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        exerciseCount: exercises.filter((exercise) => exercise.categoryId === category.id).length,
      })),
    } as T
  }

  if (pathname === '/api/admin/exercises' && method === 'POST') {
    requireAdmin()
    const name = String(body.name ?? 'Ejercicio')
    const created = saveLocalExercise({
      id: createLocalId('ex'),
      name,
      slug: slugify(name) || createLocalId('ex'),
      categoryId: typeof body.categoryId === 'string' ? body.categoryId : null,
      muscleGroup: typeof body.muscleGroup === 'string' ? body.muscleGroup : null,
      equipment: typeof body.equipment === 'string' ? body.equipment : null,
      instructions: typeof body.description === 'string' ? body.description : typeof body.cues === 'string' ? body.cues : null,
      videoUrl: typeof body.videoUrl === 'string' ? body.videoUrl : null,
      imageUrl: null,
      isActive: true,
    })
    return mapExercise(created, listLocalCategories()) as T
  }

  const exerciseMatch = pathname.match(/^\/api\/admin\/exercises\/([^/]+)$/)
  if (exerciseMatch && method === 'PUT') {
    requireAdmin()
    const current = listLocalExercises().find((item) => item.id === exerciseMatch[1])
    if (!current) {
      throw new ApiError('Ejercicio no encontrado.', 404)
    }
    const name = typeof body.name === 'string' ? body.name : current.name
    const updated = saveLocalExercise({
      ...current,
      name,
      slug: slugify(name) || current.slug,
      categoryId: typeof body.categoryId === 'string' ? body.categoryId : current.categoryId,
      equipment: typeof body.equipment === 'string' ? body.equipment : current.equipment,
      instructions:
        typeof body.description === 'string'
          ? body.description
          : typeof body.cues === 'string'
            ? body.cues
            : current.instructions,
      videoUrl: typeof body.videoUrl === 'string' ? body.videoUrl : current.videoUrl,
    })
    return mapExercise(updated, listLocalCategories()) as T
  }

  if (exerciseMatch && method === 'DELETE') {
    requireAdmin()
    deleteLocalExercise(exerciseMatch[1])
    return {} as T
  }

  if (pathname === '/api/admin/categories' && method === 'POST') {
    requireAdmin()
    const name = String(body.name ?? 'Categoría')
    const created = saveLocalCategory({
      id: createLocalId('cat'),
      name,
      slug: slugify(name) || createLocalId('cat'),
      sortOrder: listLocalCategories().length + 1,
    })
    return created as T
  }

  const categoryMatch = pathname.match(/^\/api\/admin\/categories\/([^/]+)$/)
  if (categoryMatch && method === 'PUT') {
    requireAdmin()
    const current = listLocalCategories().find((item) => item.id === categoryMatch[1])
    if (!current) {
      throw new ApiError('Categoría no encontrada.', 404)
    }
    const name = typeof body.name === 'string' ? body.name : current.name
    return saveLocalCategory({
      ...current,
      name,
      slug: slugify(name) || current.slug,
    }) as T
  }

  if (categoryMatch && method === 'DELETE') {
    requireAdmin()
    deleteLocalCategory(categoryMatch[1])
    return {} as T
  }

  const clientPlanMatch = pathname.match(/^\/api\/admin\/clients\/([^/]+)\/exercises$/)
  if (clientPlanMatch && method === 'GET') {
    requireAdmin()
    return clientPlan(clientPlanMatch[1]) as T
  }

  if (clientPlanMatch && method === 'POST') {
    requireAdmin()
    const clientId = clientPlanMatch[1]
    const created = saveLocalAssignment({
      id: createLocalId('asg'),
      clientId,
      exerciseId: String(body.exerciseId ?? ''),
      weekday: typeof body.weekday === 'number' ? body.weekday : Number(body.weekday ?? 1),
      sets: typeof body.sets === 'number' ? body.sets : null,
      reps: typeof body.reps === 'string' ? body.reps : null,
      loadNote: null,
      restSeconds: typeof body.restSeconds === 'number' ? body.restSeconds : null,
      notes: typeof body.notes === 'string' ? body.notes : null,
      sortOrder: listLocalAssignments(clientId).length + 1,
    })
    void created
    return clientPlan(clientId) as T
  }

  const assignmentMatch = pathname.match(/^\/api\/admin\/clients\/([^/]+)\/exercises\/([^/]+)$/)
  if (assignmentMatch && method === 'PUT') {
    requireAdmin()
    const [, clientId, assignmentId] = assignmentMatch
    const current = listLocalAssignments(clientId).find((item) => item.id === assignmentId)
    if (!current) {
      throw new ApiError('Asignación no encontrada.', 404)
    }
    saveLocalAssignment({
      ...current,
      exerciseId: typeof body.exerciseId === 'string' ? body.exerciseId : current.exerciseId,
      weekday: typeof body.weekday === 'number' ? body.weekday : current.weekday,
      sets: typeof body.sets === 'number' ? body.sets : current.sets,
      reps: typeof body.reps === 'string' ? body.reps : current.reps,
      restSeconds: typeof body.restSeconds === 'number' ? body.restSeconds : current.restSeconds,
      notes: typeof body.notes === 'string' ? body.notes : current.notes,
    })
    return clientPlan(clientId) as T
  }

  if (assignmentMatch && method === 'DELETE') {
    requireAdmin()
    deleteLocalAssignment(assignmentMatch[2])
    return {} as T
  }

  if (pathname === '/api/account/exercises' && method === 'GET') {
    const user = requireClient()
    return clientPlan(user.id) as T
  }

  const completionMatch = pathname.match(/^\/api\/account\/exercises\/([^/]+)\/completion$/)
  if (completionMatch && method === 'PUT') {
    const user = requireClient()
    // Demo local: devolvemos el plan sin persistir estados de completado complejos.
    return clientPlan(user.id) as T
  }

  throw new ApiError(`Ruta local no implementada: ${method} ${pathname}`, 404)
}
