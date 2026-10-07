const EQUIPMENT = new Set([
  'peso_corporal',
  'barra',
  'mancuernas',
  'kettlebell',
  'banco',
  'maquina',
  'banda',
  'otro',
])

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(value, max) {
  const text = asTrimmedString(value)
  if (!text) {
    return null
  }
  if (text.length > max) {
    return undefined
  }
  return text
}

function parseVideoUrl(value) {
  const text = asTrimmedString(value)
  if (!text) {
    return null
  }
  if (text.length > 400) {
    return undefined
  }
  try {
    const url = new URL(text)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return undefined
    }
    return url.toString()
  } catch {
    return undefined
  }
}

export function parseCategoryBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const name = asTrimmedString(body.name)
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: 'Indica un nombre de categoría (2 a 80 caracteres).' }
  }
  return { ok: true, value: { name } }
}

export function parseExerciseBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const name = asTrimmedString(body.name)
  const categoryId = asTrimmedString(body.categoryId)
  const equipment = asTrimmedString(body.equipment)
  const description = optionalText(body.description, 800)
  const cues = optionalText(body.cues, 500)
  const videoUrl = parseVideoUrl(body.videoUrl)
  const setup = optionalText(body.setup, 800)
  const mistakes = optionalText(body.mistakes, 800)
  const tempo = optionalText(body.tempo, 40)
  const primaryMuscles = optionalText(body.primaryMuscles, 160)
  const difficultyRaw = asTrimmedString(body.difficulty)
  const difficulty = difficultyRaw === '' ? null : difficultyRaw
  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: 'Indica un nombre de ejercicio (2 a 120 caracteres).' }
  }
  if (!UUID_PATTERN.test(categoryId)) {
    return { ok: false, error: 'Elige una categoría.' }
  }
  if (!EQUIPMENT.has(equipment)) {
    return { ok: false, error: 'Material no válido.' }
  }
  if (difficulty && !['principiante', 'intermedio', 'avanzado'].includes(difficulty)) {
    return { ok: false, error: 'Nivel no válido.' }
  }
  if (description === undefined) {
    return { ok: false, error: 'La descripción es demasiado larga.' }
  }
  if (cues === undefined) {
    return { ok: false, error: 'Las indicaciones son demasiado largas.' }
  }
  if (videoUrl === undefined) {
    return { ok: false, error: 'El vídeo debe ser una URL http o https.' }
  }
  if (setup === undefined) {
    return { ok: false, error: 'El montaje es demasiado largo.' }
  }
  if (mistakes === undefined) {
    return { ok: false, error: 'Los errores son demasiado largos.' }
  }
  if (tempo === undefined) {
    return { ok: false, error: 'El tempo es demasiado largo.' }
  }
  if (primaryMuscles === undefined) {
    return { ok: false, error: 'Los músculos son demasiado largos.' }
  }
  return {
    ok: true,
    value: {
      name,
      categoryId,
      equipment,
      description,
      cues,
      videoUrl,
      difficulty,
      primaryMuscles,
      setup,
      mistakes,
      tempo,
    },
  }
}

export function parseAssignExerciseBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const exerciseId = asTrimmedString(body.exerciseId)
  const reps = optionalText(body.reps, 40)
  const notes = optionalText(body.notes, 400)
  const setsRaw = body.sets
  const restRaw = body.restSeconds
  const weekdayRaw = body.weekday
  const sets =
    setsRaw === '' || setsRaw === null || setsRaw === undefined ? null : Number(setsRaw)
  const restSeconds =
    restRaw === '' || restRaw === null || restRaw === undefined ? null : Number(restRaw)
  const weekday = Number(weekdayRaw)
  if (!exerciseId) {
    return { ok: false, error: 'Elige un ejercicio.' }
  }
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    return { ok: false, error: 'Elige un día de la semana (lunes a domingo).' }
  }
  if (sets !== null && (!Number.isInteger(sets) || sets < 1 || sets > 20)) {
    return { ok: false, error: 'Las series deben ser un número entre 1 y 20.' }
  }
  if (restSeconds !== null && (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 600)) {
    return { ok: false, error: 'El descanso debe ser entre 0 y 600 segundos.' }
  }
  if (reps === undefined) {
    return { ok: false, error: 'Las repeticiones son demasiado largas.' }
  }
  if (notes === undefined) {
    return { ok: false, error: 'La nota es demasiado larga.' }
  }
  return {
    ok: true,
    value: { exerciseId, weekday, sets, reps, restSeconds, notes },
  }
}

export function parseUpdateAssignmentBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const reps = optionalText(body.reps, 40)
  const notes = optionalText(body.notes, 400)
  const setsRaw = body.sets
  const restRaw = body.restSeconds
  const weekdayRaw = body.weekday
  const sets =
    setsRaw === '' || setsRaw === null || setsRaw === undefined ? null : Number(setsRaw)
  const restSeconds =
    restRaw === '' || restRaw === null || restRaw === undefined ? null : Number(restRaw)
  const weekday = Number(weekdayRaw)
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    return { ok: false, error: 'Elige un día de la semana (lunes a domingo).' }
  }
  if (sets !== null && (!Number.isInteger(sets) || sets < 1 || sets > 20)) {
    return { ok: false, error: 'Las series deben ser un número entre 1 y 20.' }
  }
  if (restSeconds !== null && (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 600)) {
    return { ok: false, error: 'El descanso debe ser entre 0 y 600 segundos.' }
  }
  if (reps === undefined) {
    return { ok: false, error: 'Las repeticiones son demasiado largas.' }
  }
  if (notes === undefined) {
    return { ok: false, error: 'La nota es demasiado larga.' }
  }
  return {
    ok: true,
    value: { weekday, sets, reps, restSeconds, notes },
  }
}

export function parseCompletionBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const status = body.status
  if (status === null) {
    return { ok: true, value: { status: null } }
  }
  if (status !== 'done' && status !== 'missed') {
    return { ok: false, error: 'Indica si lo hiciste o no.' }
  }
  return { ok: true, value: { status } }
}
