import { pool } from './db.js'

function toIsoDate(value) {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return String(value).slice(0, 10)
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    exerciseCount: Number(row.exercise_count ?? 0),
  }
}

const EXERCISE_SELECT = `e.id, e.name, e.description, e.category_id, c.name AS category_name,
            e.muscle_group, e.equipment, e.cues, e.video_url, e.difficulty, e.primary_muscles,
            e.setup, e.mistakes, e.tempo, e.is_active, e.created_at`

function mapExercise(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category_name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    cues: row.cues,
    videoUrl: row.video_url,
    difficulty: row.difficulty,
    primaryMuscles: row.primary_muscles,
    setup: row.setup,
    mistakes: row.mistakes,
    tempo: row.tempo,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

function mapAssignment(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    exerciseId: row.exercise_id,
    weekday: row.weekday,
    sets: row.sets,
    reps: row.reps,
    restSeconds: row.rest_seconds,
    notes: row.notes,
    createdAt: row.created_at,
    completionStatus: row.completion_status ?? null,
    completedOn: row.completed_on ? toIsoDate(row.completed_on) : null,
    exercise: {
      id: row.exercise_id,
      name: row.name,
      description: row.description,
      categoryId: row.category_id,
      categoryName: row.category_name,
      muscleGroup: row.muscle_group,
      equipment: row.equipment,
      cues: row.cues,
      videoUrl: row.video_url,
      difficulty: row.difficulty,
      primaryMuscles: row.primary_muscles,
      setup: row.setup,
      mistakes: row.mistakes,
      tempo: row.tempo,
    },
  }
}

export async function listCategories() {
  const result = await pool.query(
    `SELECT c.id, c.name, c.sort_order, c.is_active,
            COUNT(e.id) FILTER (WHERE e.is_active = true) AS exercise_count
     FROM exercise_categories c
     LEFT JOIN exercises e ON e.category_id = c.id
     WHERE c.is_active = true
     GROUP BY c.id
     ORDER BY c.name`,
  )
  return result.rows.map(mapCategory)
}

export async function findActiveCategory(id) {
  const result = await pool.query(
    `SELECT id, name FROM exercise_categories WHERE id = $1 AND is_active = true LIMIT 1`,
    [id],
  )
  return result.rows[0] ?? null
}

export async function createCategory({ name }) {
  const result = await pool.query(
    `INSERT INTO exercise_categories (name, sort_order)
     VALUES ($1, 0)
     RETURNING id, name, sort_order, is_active`,
    [name],
  )
  return mapCategory({ ...result.rows[0], exercise_count: 0 })
}

export async function updateCategory(id, { name }) {
  const result = await pool.query(
    `UPDATE exercise_categories
     SET name = $2
     WHERE id = $1 AND is_active = true
     RETURNING id, name, sort_order, is_active`,
    [id, name],
  )
  if (!result.rows[0]) {
    return null
  }
  const count = await pool.query(
    `SELECT COUNT(*)::int AS exercise_count FROM exercises WHERE category_id = $1 AND is_active = true`,
    [id],
  )
  return mapCategory({ ...result.rows[0], exercise_count: count.rows[0].exercise_count })
}

export async function deactivateCategory(id) {
  const inUse = await pool.query(
    `SELECT 1 FROM exercises WHERE category_id = $1 AND is_active = true LIMIT 1`,
    [id],
  )
  if (inUse.rows[0]) {
    return { ok: false, reason: 'in_use' }
  }
  const result = await pool.query(
    `UPDATE exercise_categories
     SET is_active = false
     WHERE id = $1 AND is_active = true
     RETURNING id`,
    [id],
  )
  return { ok: Boolean(result.rows[0]) }
}

export async function listExercises() {
  const result = await pool.query(
    `SELECT ${EXERCISE_SELECT}
     FROM exercises e
     JOIN exercise_categories c ON c.id = e.category_id
     WHERE e.is_active = true
     ORDER BY c.name, e.name`,
  )
  return result.rows.map(mapExercise)
}

export async function createExercise(data) {
  const category = await findActiveCategory(data.categoryId)
  if (!category) {
    return null
  }
  const result = await pool.query(
    `INSERT INTO exercises (
        name, description, category_id, muscle_group, equipment, cues, video_url,
        difficulty, primary_muscles, setup, mistakes, tempo
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, name, description, category_id, muscle_group, equipment, cues, video_url,
               difficulty, primary_muscles, setup, mistakes, tempo, is_active, created_at`,
    [
      data.name,
      data.description,
      data.categoryId,
      category.name.toLowerCase().replace(/\s+/g, '_'),
      data.equipment,
      data.cues,
      data.videoUrl,
      data.difficulty,
      data.primaryMuscles,
      data.setup,
      data.mistakes,
      data.tempo,
    ],
  )
  return mapExercise({ ...result.rows[0], category_name: category.name })
}

export async function updateExercise(id, data) {
  const category = await findActiveCategory(data.categoryId)
  if (!category) {
    return null
  }
  const result = await pool.query(
    `UPDATE exercises
     SET name = $2,
         description = $3,
         category_id = $4,
         muscle_group = $5,
         equipment = $6,
         cues = $7,
         video_url = $8,
         difficulty = $9,
         primary_muscles = $10,
         setup = $11,
         mistakes = $12,
         tempo = $13,
         updated_at = now()
     WHERE id = $1 AND is_active = true
     RETURNING id, name, description, category_id, muscle_group, equipment, cues, video_url,
               difficulty, primary_muscles, setup, mistakes, tempo, is_active, created_at`,
    [
      id,
      data.name,
      data.description,
      data.categoryId,
      category.name.toLowerCase().replace(/\s+/g, '_'),
      data.equipment,
      data.cues,
      data.videoUrl,
      data.difficulty,
      data.primaryMuscles,
      data.setup,
      data.mistakes,
      data.tempo,
    ],
  )
  return result.rows[0] ? mapExercise({ ...result.rows[0], category_name: category.name }) : null
}

export async function deactivateExercise(id) {
  const result = await pool.query(
    `UPDATE exercises
     SET is_active = false, updated_at = now()
     WHERE id = $1 AND is_active = true
     RETURNING id`,
    [id],
  )
  return Boolean(result.rows[0])
}

export async function findClientById(id) {
  const result = await pool.query(
    `SELECT id, email, display_name, role, is_active
     FROM users
     WHERE id = $1 AND role = 'client'
     LIMIT 1`,
    [id],
  )
  return result.rows[0] ?? null
}

export async function findActiveExercise(id) {
  const result = await pool.query(
    `SELECT id FROM exercises WHERE id = $1 AND is_active = true LIMIT 1`,
    [id],
  )
  return result.rows[0] ?? null
}

export async function listClientExercises(clientId) {
  const result = await pool.query(
    `SELECT ce.id, ce.client_id, ce.exercise_id, ce.weekday, ce.sets, ce.reps, ce.rest_seconds, ce.notes, ce.created_at,
            e.name, e.description, e.category_id, c.name AS category_name,
            e.muscle_group, e.equipment, e.cues, e.video_url,
            e.difficulty, e.primary_muscles, e.setup, e.mistakes, e.tempo,
            cx.status AS completion_status, cx.completed_on
     FROM client_exercises ce
     JOIN exercises e ON e.id = ce.exercise_id
     JOIN exercise_categories c ON c.id = e.category_id
     LEFT JOIN client_exercise_completions cx
       ON cx.client_exercise_id = ce.id
      AND cx.completed_on = (date_trunc('week', CURRENT_DATE)::date + (ce.weekday - 1))
     WHERE ce.client_id = $1 AND e.is_active = true
     ORDER BY ce.weekday, c.name, e.name`,
    [clientId],
  )
  return result.rows.map(mapAssignment)
}

/** Plan del cliente + semana en curso (lunes). El seguimiento se guarda por fecha y cada lunes empieza vacío. */
export async function getClientPlan(clientId) {
  const week = await pool.query(`SELECT date_trunc('week', CURRENT_DATE)::date AS week_start`)
  return {
    weekStart: toIsoDate(week.rows[0].week_start),
    exercises: await listClientExercises(clientId),
  }
}

export async function assignExercise(clientId, data) {
  const result = await pool.query(
    `INSERT INTO client_exercises (client_id, exercise_id, weekday, sets, reps, rest_seconds, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (client_id, exercise_id, weekday)
     DO UPDATE SET sets = EXCLUDED.sets, reps = EXCLUDED.reps, rest_seconds = EXCLUDED.rest_seconds, notes = EXCLUDED.notes
     RETURNING id`,
    [clientId, data.exerciseId, data.weekday, data.sets, data.reps, data.restSeconds, data.notes],
  )
  return result.rows[0]?.id ?? null
}

export async function unassignExercise(clientId, assignmentId) {
  const result = await pool.query(
    `DELETE FROM client_exercises
     WHERE client_id = $1 AND id = $2
     RETURNING id`,
    [clientId, assignmentId],
  )
  return Boolean(result.rows[0])
}

/** Actualiza dosis/día de una asignación concreta (no toca la biblioteca ni otros clientes). */
export async function updateAssignmentDose(clientId, assignmentId, data) {
  try {
    const result = await pool.query(
      `UPDATE client_exercises
       SET weekday = $3,
           sets = $4,
           reps = $5,
           rest_seconds = $6,
           notes = $7
       WHERE client_id = $1 AND id = $2
       RETURNING id`,
      [clientId, assignmentId, data.weekday, data.sets, data.reps, data.restSeconds, data.notes],
    )
    return result.rows[0] ? { ok: true } : { ok: false, reason: 'not_found' }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return { ok: false, reason: 'duplicate' }
    }
    throw error
  }
}

export async function findClientAssignment(clientId, assignmentId) {
  const result = await pool.query(
    `SELECT id, weekday FROM client_exercises WHERE client_id = $1 AND id = $2 LIMIT 1`,
    [clientId, assignmentId],
  )
  return result.rows[0] ?? null
}

export async function setAssignmentCompletion(clientId, assignmentId, status) {
  const assignment = await findClientAssignment(clientId, assignmentId)
  if (!assignment) {
    return { ok: false, reason: 'not_found' }
  }

  const dateResult = await pool.query(
    `SELECT (date_trunc('week', CURRENT_DATE)::date + ($1::int - 1))::date AS completed_on`,
    [assignment.weekday],
  )
  const completedOn = dateResult.rows[0].completed_on

  if (status === null) {
    await pool.query(
      `DELETE FROM client_exercise_completions
       WHERE client_exercise_id = $1 AND completed_on = $2`,
      [assignmentId, completedOn],
    )
    return { ok: true, completionStatus: null, completedOn: toIsoDate(completedOn) }
  }

  await pool.query(
    `INSERT INTO client_exercise_completions (client_exercise_id, completed_on, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (client_exercise_id, completed_on)
     DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
    [assignmentId, completedOn, status],
  )
  return { ok: true, completionStatus: status, completedOn: toIsoDate(completedOn) }
}
