import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { getSiteByTrainerSlug, insertLead, pool } from './db.js'
import { parseLeadBody } from './validateLead.js'
import {
  COOKIE_NAME,
  cookieOptions,
  createSessionToken,
  createUser,
  deleteSession,
  findSessionUser,
  findUserByEmail,
  hashPassword,
  hashToken,
  insertSession,
  listClients,
  listLeads,
  publicUser,
  sessionExpiryDate,
  updateLeadStatus,
  verifyPassword,
} from './users.js'
import {
  isUuid,
  parseCreateClientBody,
  parseLeadStatusBody,
  parseLoginBody,
} from './validateAuth.js'
import {
  parseAssignExerciseBody,
  parseCategoryBody,
  parseCompletionBody,
  parseExerciseBody,
  parseUpdateAssignmentBody,
} from './validateExercises.js'
import {
  assignExercise,
  createCategory,
  createExercise,
  deactivateCategory,
  deactivateExercise,
  findActiveCategory,
  findActiveExercise,
  findClientById,
  listCategories,
  getClientPlan,
  listExercises,
  setAssignmentCompletion,
  unassignExercise,
  updateAssignmentDose,
  updateCategory,
  updateExercise,
} from './exercises.js'

const PORT = Number(process.env.PORT || 4000)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const TRAINER_SLUG = process.env.TRAINER_SLUG || 'entrenador'
const SESSION_SECRET = process.env.SESSION_SECRET || ''

if (SESSION_SECRET.length < 32) {
  console.error('Falta SESSION_SECRET (mínimo 32 caracteres) en backend/.env')
  process.exit(1)
}

const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
)
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())

const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Has enviado demasiadas solicitudes. Prueba más tarde.' },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Prueba más tarde.' },
})

async function attachUser(req, _res, next) {
  req.user = null
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) {
    next()
    return
  }
  try {
    const row = await findSessionUser(hashToken(token, SESSION_SECRET))
    if (row?.is_active) {
      req.user = publicUser(row)
    }
  } catch (error) {
    console.error('session_failed', error instanceof Error ? error.message : 'unknown')
  }
  next()
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Necesitas iniciar sesión.' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'No tienes permiso para esto.' })
      return
    }
    next()
  }
}

app.use(attachUser)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/site', async (_req, res) => {
  try {
    const site = await getSiteByTrainerSlug(TRAINER_SLUG)
    if (!site) {
      res.status(404).json({ error: 'No hay datos del entrenador.' })
      return
    }
    res.json(site)
  } catch (error) {
    console.error('site_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido cargar el sitio.' })
  }
})

app.post('/api/leads', leadLimiter, async (req, res) => {
  const parsed = parseLeadBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }

  try {
    const site = await getSiteByTrainerSlug(TRAINER_SLUG)
    if (!site) {
      res.status(503).json({ error: 'El formulario no está disponible.' })
      return
    }
    const id = await insertLead({
      trainerId: site.trainer.id,
      ...parsed.value,
    })
    res.status(201).json({ id })
  } catch (error) {
    console.error('lead_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido enviar la solicitud.' })
  }
})

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No hay sesión.' })
    return
  }
  res.json({ user: req.user })
})

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const parsed = parseLoginBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const user = await findUserByEmail(parsed.value.email)
    const valid = await verifyPassword(
      parsed.value.password,
      user?.is_active ? user.password_hash : '$2b$12$BJSiCFlOt/BKw63r/B.T/un6tRQ4BLtXzMrXATT/jmuT2ybu5qFv6',
    )
    if (!user?.is_active || !valid) {
      res.status(401).json({ error: 'Email o contraseña no válidos.' })
      return
    }
    const token = createSessionToken()
    await insertSession(user.id, hashToken(token, SESSION_SECRET), sessionExpiryDate())
    res.cookie(COOKIE_NAME, token, cookieOptions())
    res.json({ user: publicUser(user) })
  } catch (error) {
    console.error('login_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido iniciar sesión.' })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (token) {
    try {
      await deleteSession(hashToken(token, SESSION_SECRET))
    } catch (error) {
      console.error('logout_failed', error instanceof Error ? error.message : 'unknown')
    }
  }
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 })
  res.json({ ok: true })
})

app.get('/api/admin/leads', requireRole('admin'), async (_req, res) => {
  try {
    res.json({ leads: await listLeads() })
  } catch (error) {
    console.error('admin_leads_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se han podido cargar las solicitudes.' })
  }
})

app.patch('/api/admin/leads/:id', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'Solicitud no válida.' })
    return
  }
  const parsed = parseLeadStatusBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const ok = await updateLeadStatus(req.params.id, parsed.value.status)
    if (!ok) {
      res.status(404).json({ error: 'No existe esa solicitud.' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('admin_lead_patch_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido actualizar.' })
  }
})

app.get('/api/admin/clients', requireRole('admin'), async (_req, res) => {
  try {
    res.json({ clients: await listClients() })
  } catch (error) {
    console.error('admin_clients_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se han podido cargar los clientes.' })
  }
})

app.post('/api/admin/clients', requireRole('admin'), async (req, res) => {
  const parsed = parseCreateClientBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const passwordHash = await hashPassword(parsed.value.password)
    const row = await createUser({
      email: parsed.value.email,
      passwordHash,
      displayName: parsed.value.displayName,
      role: 'client',
    })
    res.status(201).json({ user: publicUser(row) })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
      return
    }
    console.error('admin_client_create_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido crear el cliente.' })
  }
})

app.get('/api/account', requireRole('client', 'admin'), (req, res) => {
  res.json({ user: req.user })
})

app.get('/api/admin/categories', requireRole('admin'), async (_req, res) => {
  try {
    res.json({ categories: await listCategories() })
  } catch (error) {
    console.error('admin_categories_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se han podido cargar las categorías.' })
  }
})

app.post('/api/admin/categories', requireRole('admin'), async (req, res) => {
  const parsed = parseCategoryBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const category = await createCategory(parsed.value)
    res.status(201).json({ category })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' })
      return
    }
    console.error('admin_category_create_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido crear la categoría.' })
  }
})

app.patch('/api/admin/categories/:id', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'Categoría no válida.' })
    return
  }
  const parsed = parseCategoryBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const category = await updateCategory(req.params.id, parsed.value)
    if (!category) {
      res.status(404).json({ error: 'No existe esa categoría.' })
      return
    }
    res.json({ category })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' })
      return
    }
    console.error('admin_category_patch_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido actualizar la categoría.' })
  }
})

app.delete('/api/admin/categories/:id', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'Categoría no válida.' })
    return
  }
  try {
    const result = await deactivateCategory(req.params.id)
    if (result.reason === 'in_use') {
      res.status(409).json({ error: 'Mueve o archiva los ejercicios de esa categoría antes de borrarla.' })
      return
    }
    if (!result.ok) {
      res.status(404).json({ error: 'No existe esa categoría.' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('admin_category_delete_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido archivar la categoría.' })
  }
})

app.get('/api/admin/exercises', requireRole('admin'), async (_req, res) => {
  try {
    const [exercises, categories] = await Promise.all([listExercises(), listCategories()])
    res.json({ exercises, categories })
  } catch (error) {
    console.error('admin_exercises_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se han podido cargar los ejercicios.' })
  }
})

app.post('/api/admin/exercises', requireRole('admin'), async (req, res) => {
  const parsed = parseExerciseBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    if (!(await findActiveCategory(parsed.value.categoryId))) {
      res.status(400).json({ error: 'Elige una categoría activa.' })
      return
    }
    const exercise = await createExercise(parsed.value)
    if (!exercise) {
      res.status(400).json({ error: 'Elige una categoría activa.' })
      return
    }
    res.status(201).json({ exercise })
  } catch (error) {
    console.error('admin_exercise_create_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido crear el ejercicio.' })
  }
})

app.patch('/api/admin/exercises/:id', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'Ejercicio no válido.' })
    return
  }
  const parsed = parseExerciseBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const exercise = await updateExercise(req.params.id, parsed.value)
    if (!exercise) {
      res.status(404).json({ error: 'No existe ese ejercicio o la categoría no es válida.' })
      return
    }
    res.json({ exercise })
  } catch (error) {
    console.error('admin_exercise_patch_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido actualizar el ejercicio.' })
  }
})

app.delete('/api/admin/exercises/:id', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'Ejercicio no válido.' })
    return
  }
  try {
    const ok = await deactivateExercise(req.params.id)
    if (!ok) {
      res.status(404).json({ error: 'No existe ese ejercicio.' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('admin_exercise_delete_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido archivar el ejercicio.' })
  }
})

app.get('/api/admin/clients/:id/exercises', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'Cliente no válido.' })
    return
  }
  try {
    const client = await findClientById(req.params.id)
    if (!client) {
      res.status(404).json({ error: 'No existe ese cliente.' })
      return
    }
    res.json(await getClientPlan(req.params.id))
  } catch (error) {
    console.error('admin_client_exercises_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se han podido cargar los ejercicios del cliente.' })
  }
})

app.post('/api/admin/clients/:id/exercises', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(400).json({ error: 'Cliente no válido.' })
    return
  }
  const parsed = parseAssignExerciseBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  if (!isUuid(parsed.value.exerciseId)) {
    res.status(400).json({ error: 'Ejercicio no válido.' })
    return
  }
  try {
    const client = await findClientById(req.params.id)
    if (!client) {
      res.status(404).json({ error: 'No existe ese cliente.' })
      return
    }
    const exercise = await findActiveExercise(parsed.value.exerciseId)
    if (!exercise) {
      res.status(404).json({ error: 'No existe ese ejercicio.' })
      return
    }
    await assignExercise(req.params.id, parsed.value)
    res.status(201).json(await getClientPlan(req.params.id))
  } catch (error) {
    console.error('admin_assign_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido asignar el ejercicio.' })
  }
})

app.patch('/api/admin/clients/:id/exercises/:assignmentId', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id) || !isUuid(req.params.assignmentId)) {
    res.status(400).json({ error: 'Datos no válidos.' })
    return
  }
  const parsed = parseUpdateAssignmentBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const result = await updateAssignmentDose(req.params.id, req.params.assignmentId, parsed.value)
    if (!result.ok && result.reason === 'not_found') {
      res.status(404).json({ error: 'Ese ejercicio no está asignado.' })
      return
    }
    if (!result.ok && result.reason === 'duplicate') {
      res.status(409).json({ error: 'Ese ejercicio ya está ese día. Elige otro día o quita el duplicado.' })
      return
    }
    res.json(await getClientPlan(req.params.id))
  } catch (error) {
    console.error('admin_update_assignment_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido actualizar la dosis.' })
  }
})

app.delete('/api/admin/clients/:id/exercises/:assignmentId', requireRole('admin'), async (req, res) => {
  if (!isUuid(req.params.id) || !isUuid(req.params.assignmentId)) {
    res.status(400).json({ error: 'Datos no válidos.' })
    return
  }
  try {
    const ok = await unassignExercise(req.params.id, req.params.assignmentId)
    if (!ok) {
      res.status(404).json({ error: 'Ese ejercicio no está asignado.' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('admin_unassign_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido quitar el ejercicio.' })
  }
})

app.get('/api/account/exercises', requireRole('client'), async (req, res) => {
  try {
    res.json(await getClientPlan(req.user.id))
  } catch (error) {
    console.error('account_exercises_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se han podido cargar tus ejercicios.' })
  }
})

app.put('/api/account/exercises/:assignmentId/completion', requireRole('client'), async (req, res) => {
  if (!isUuid(req.params.assignmentId)) {
    res.status(400).json({ error: 'Ejercicio no válido.' })
    return
  }
  const parsed = parseCompletionBody(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  try {
    const result = await setAssignmentCompletion(req.user.id, req.params.assignmentId, parsed.value.status)
    if (!result.ok) {
      res.status(404).json({ error: 'Ese ejercicio no está en tu plan.' })
      return
    }
    const plan = await getClientPlan(req.user.id)
    res.json({
      completionStatus: result.completionStatus,
      completedOn: result.completedOn,
      ...plan,
    })
  } catch (error) {
    console.error('account_completion_failed', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'No se ha podido guardar el seguimiento.' })
  }
})

const server = app.listen(PORT, () => {
  console.log(`API en http://127.0.0.1:${PORT}`)
})

async function shutdown() {
  server.close()
  await pool.end()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
