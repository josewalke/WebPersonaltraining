import 'dotenv/config'
import bcrypt from 'bcrypt'
import { pool } from '../src/db.js'
import { upsertUser } from '../src/users.js'

const demoPassword = process.env.DEMO_CLIENT_PASSWORD || 'PowerUp-cliente-10'

function todayIsoWeekday() {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

/**
 * Estudio demo: varios clientes con objetivos distintos, planes semanales
 * y seguimiento hecho/no hecho coherente con el día de hoy.
 */
const STUDIO_CLIENTS = [
  {
    email: (process.env.DEMO_CLIENT_EMAIL || 'cliente@powerup.local').trim().toLowerCase(),
    displayName: (process.env.DEMO_CLIENT_NAME || 'Ana García').trim(),
    label: 'fuerza + técnica (cliente principal)',
    week: {
      1: [
        { name: 'Sentadilla con barra', sets: 4, reps: '6-8', rest: 120, notes: 'Profundidad controlada. Si falla la 6ª, baja 2,5 kg.' },
        { name: 'Press banca', sets: 4, reps: '8', rest: 90, notes: 'Última serie cerca del fallo técnico.' },
        { name: 'Remo con mancuerna', sets: 3, reps: '10-12', rest: 75, notes: 'Pausa 1 s arriba, sin rotar el tronco.' },
        { name: 'Plancha', sets: 3, reps: '40s', rest: 60, notes: 'Si tiemblo, acorta 5 s pero mantén forma.' },
      ],
      2: [
        { name: 'Movilidad de cadera 90/90', sets: 2, reps: '8/lado', rest: 30, notes: 'Día regenerativo. Sin prisa.' },
        { name: 'Cat-cow + respiración', sets: 2, reps: '10', rest: 20, notes: null },
        { name: 'Face pull', sets: 3, reps: '15', rest: 45, notes: 'Hombros sanos: no subir de peso.' },
        { name: 'Dead bug', sets: 3, reps: '8/lado', rest: 40, notes: null },
      ],
      3: [
        { name: 'Peso muerto rumano', sets: 4, reps: '8', rest: 120, notes: 'Barra pegada. Siente isquios, no lumbar.' },
        { name: 'Press militar', sets: 3, reps: '8-10', rest: 90, notes: 'Costillas abajo todo el rato.' },
        { name: 'Jalón al pecho', sets: 3, reps: '10-12', rest: 75, notes: null },
        { name: 'Press francés', sets: 3, reps: '12', rest: 60, notes: null },
      ],
      4: [
        { name: 'Farmer carry', sets: 4, reps: '40m', rest: 60, notes: 'Pasos cortos, mirada al frente.' },
        { name: 'Swing con kettlebell', sets: 5, reps: '12', rest: 60, notes: 'Potencia de cadera, no de brazos.' },
        { name: 'Plancha', sets: 3, reps: '30s', rest: 45, notes: null },
      ],
      5: [
        { name: 'Hip thrust', sets: 4, reps: '8-10', rest: 90, notes: 'Aprieta 1 s arriba.' },
        { name: 'Press inclinado mancuernas', sets: 3, reps: '10', rest: 75, notes: null },
        { name: 'Dominadas', sets: 4, reps: 'máx-1', rest: 120, notes: 'Deja 1 rep en recámara.' },
        { name: 'Fondos en paralelas asistidos', sets: 3, reps: '8-10', rest: 75, notes: 'Asistencia solo la justa.' },
      ],
    },
  },
  {
    email: 'carlos.ruiz@powerup.local',
    displayName: 'Carlos Ruiz',
    label: 'hipertrofia 3 días (full body)',
    week: {
      1: [
        { name: 'Sentadilla con barra', sets: 4, reps: '8-10', rest: 100, notes: 'Deja 2 reps en recámara.' },
        { name: 'Press banca', sets: 4, reps: '8-10', rest: 90, notes: null },
        { name: 'Remo con mancuerna', sets: 3, reps: '12', rest: 70, notes: null },
        { name: 'Elevaciones laterales', sets: 3, reps: '15', rest: 45, notes: null },
        { name: 'Plancha', sets: 3, reps: '45s', rest: 50, notes: null },
      ],
      3: [
        { name: 'Peso muerto rumano', sets: 4, reps: '8-10', rest: 100, notes: null },
        { name: 'Press militar', sets: 4, reps: '8-10', rest: 90, notes: null },
        { name: 'Jalón al pecho', sets: 3, reps: '10-12', rest: 70, notes: null },
        { name: 'Curl de bíceps mancuernas', sets: 3, reps: '12', rest: 50, notes: null },
        { name: 'Dead bug', sets: 3, reps: '10/lado', rest: 40, notes: null },
      ],
      5: [
        { name: 'Hip thrust', sets: 4, reps: '10', rest: 90, notes: null },
        { name: 'Press inclinado mancuernas', sets: 3, reps: '10-12', rest: 75, notes: null },
        { name: 'Remo en máquina sentado', sets: 3, reps: '12', rest: 70, notes: null },
        { name: 'Face pull', sets: 3, reps: '15', rest: 45, notes: 'Obligatorio tras empuje.' },
        { name: 'Press francés', sets: 3, reps: '12', rest: 50, notes: null },
      ],
    },
  },
  {
    email: 'lucia.martin@powerup.local',
    displayName: 'Lucía Martín',
    label: 'online · recomposición',
    week: {
      2: [
        { name: 'Zancada caminando', sets: 3, reps: '10/pierna', rest: 75, notes: 'Grábate 1 serie para feedback.' },
        { name: 'Press inclinado mancuernas', sets: 3, reps: '10', rest: 75, notes: null },
        { name: 'Remo en máquina sentado', sets: 3, reps: '12', rest: 70, notes: null },
        { name: 'Plancha', sets: 3, reps: '35s', rest: 45, notes: null },
      ],
      4: [
        { name: 'Hip thrust', sets: 4, reps: '10', rest: 80, notes: null },
        { name: 'Jalón al pecho', sets: 3, reps: '12', rest: 70, notes: null },
        { name: 'Elevaciones laterales', sets: 3, reps: '15', rest: 40, notes: null },
        { name: 'Dead bug', sets: 3, reps: '8/lado', rest: 40, notes: null },
      ],
      6: [
        { name: 'Movilidad de cadera 90/90', sets: 2, reps: '8/lado', rest: 20, notes: 'Fin de semana activo.' },
        { name: 'Cat-cow + respiración', sets: 2, reps: '12', rest: 15, notes: null },
        { name: 'Farmer carry', sets: 4, reps: '30m', rest: 50, notes: null },
        { name: 'Swing con kettlebell', sets: 4, reps: '15', rest: 55, notes: 'Campana moderada.' },
      ],
    },
  },
  {
    email: 'diego.sanz@powerup.local',
    displayName: 'Diego Sanz',
    label: 'principiante · 2 días',
    week: {
      1: [
        { name: 'Sentadilla con barra', sets: 3, reps: '8', rest: 120, notes: 'Solo barra o carga muy ligera. Aprende el patrón.' },
        { name: 'Remo en máquina sentado', sets: 3, reps: '12', rest: 75, notes: null },
        { name: 'Press militar', sets: 3, reps: '8', rest: 90, notes: 'Sentado si hace falta.' },
        { name: 'Plancha', sets: 3, reps: '20s', rest: 45, notes: 'Calidad > tiempo.' },
        { name: 'Cat-cow + respiración', sets: 2, reps: '8', rest: 20, notes: null },
      ],
      4: [
        { name: 'Hip thrust', sets: 3, reps: '10', rest: 90, notes: 'Sin barra al principio: peso corporal.' },
        { name: 'Jalón al pecho', sets: 3, reps: '12', rest: 75, notes: null },
        { name: 'Face pull', sets: 3, reps: '15', rest: 45, notes: null },
        { name: 'Dead bug', sets: 3, reps: '6/lado', rest: 40, notes: null },
        { name: 'Farmer carry', sets: 3, reps: '20m', rest: 60, notes: 'Mancuernas ligeras.' },
      ],
    },
  },
  {
    email: 'marta.ibanez@powerup.local',
    displayName: 'Marta Ibáñez',
    label: 'postura + core (presencial)',
    week: {
      2: [
        { name: 'Movilidad de cadera 90/90', sets: 3, reps: '6/lado', rest: 25, notes: 'Calentamiento largo hoy.' },
        { name: 'Cat-cow + respiración', sets: 3, reps: '10', rest: 15, notes: null },
        { name: 'Face pull', sets: 4, reps: '15', rest: 40, notes: 'Prioridad nº1.' },
        { name: 'Remo con mancuerna', sets: 3, reps: '12', rest: 70, notes: null },
        { name: 'Dead bug', sets: 4, reps: '8/lado', rest: 40, notes: 'Lumbar pegada siempre.' },
      ],
      5: [
        { name: 'Zancada caminando', sets: 3, reps: '8/pierna', rest: 75, notes: 'Tronco erguido.' },
        { name: 'Press militar', sets: 3, reps: '8', rest: 90, notes: null },
        { name: 'Jalón al pecho', sets: 3, reps: '12', rest: 70, notes: null },
        { name: 'Plancha', sets: 4, reps: '25s', rest: 45, notes: null },
        { name: 'Puente de glúteo a una pierna', sets: 3, reps: '8/lado', rest: 50, notes: null },
      ],
    },
  },
]

async function ensureClient(email, displayName, password) {
  const passwordHash = await bcrypt.hash(password, 12)
  return upsertUser({
    email,
    passwordHash,
    displayName,
    role: 'client',
  })
}

async function findExerciseIdByName(name) {
  const result = await pool.query(
    `SELECT id FROM exercises WHERE name = $1 AND is_active = true LIMIT 1`,
    [name],
  )
  return result.rows[0]?.id ?? null
}

async function assignPlan(clientId, weekMap) {
  let assigned = 0
  for (const [weekday, items] of Object.entries(weekMap)) {
    for (const item of items) {
      const exerciseId = await findExerciseIdByName(item.name)
      if (!exerciseId) {
        console.warn(`  · Falta ficha «${item.name}»`)
        continue
      }
      await pool.query(
        `INSERT INTO client_exercises (client_id, exercise_id, weekday, sets, reps, rest_seconds, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (client_id, exercise_id, weekday)
         DO UPDATE SET sets = EXCLUDED.sets, reps = EXCLUDED.reps,
                       rest_seconds = EXCLUDED.rest_seconds, notes = EXCLUDED.notes`,
        [clientId, exerciseId, Number(weekday), item.sets, item.reps, item.rest, item.notes],
      )
      assigned += 1
    }
  }
  return assigned
}

/** Seguimiento de esta semana: pasado = hecho/fallado; hoy = mezcla; futuro = pendiente. */
async function simulateWeekTracking(clientId) {
  const today = todayIsoWeekday()
  const rows = await pool.query(
    `SELECT id, weekday FROM client_exercises WHERE client_id = $1 ORDER BY weekday, created_at`,
    [clientId],
  )

  for (const [index, row] of rows.rows.entries()) {
    const weekday = Number(row.weekday)
    let status = null
    if (weekday < today) {
      // Días ya pasados: la mayoría hechos, alguno fallado (realista).
      status = index % 7 === 0 ? 'missed' : 'done'
    } else if (weekday === today) {
      // Hoy: primeras del día hechas, resto pendiente.
      status = index % 3 === 0 ? 'done' : null
    }

    const dateResult = await pool.query(
      `SELECT (date_trunc('week', CURRENT_DATE)::date + ($1::int - 1))::date AS completed_on`,
      [weekday],
    )
    const completedOn = dateResult.rows[0].completed_on

    if (status === null) {
      await pool.query(
        `DELETE FROM client_exercise_completions
         WHERE client_exercise_id = $1 AND completed_on = $2`,
        [row.id, completedOn],
      )
      continue
    }

    await pool.query(
      `INSERT INTO client_exercise_completions (client_exercise_id, completed_on, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (client_exercise_id, completed_on)
       DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
      [row.id, completedOn, status],
    )
  }
}

if (demoPassword.length < 10) {
  console.error('DEMO_CLIENT_PASSWORD debe tener al menos 10 caracteres.')
  process.exitCode = 1
  await pool.end()
  process.exit(1)
}

console.log('Simulando estudio Power Up…')

for (const client of STUDIO_CLIENTS) {
  if (!client.email) {
    continue
  }
  const user = await ensureClient(client.email, client.displayName, demoPassword)
  const n = await assignPlan(user.id, client.week)
  await simulateWeekTracking(user.id)
  console.log(`✓ ${client.displayName} <${client.email}> — ${client.label} (${n} ejercicios)`)
}

await pool.end()
console.log('Seguimiento de la semana actual generado (hecho / no hecho / pendiente).')
