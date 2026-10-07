import 'dotenv/config'
import bcrypt from 'bcrypt'
import { pool } from '../src/db.js'
import { upsertUser } from '../src/users.js'

async function seedRole({ email, password, displayName, role, label }) {
  if (!email || !password) {
    console.log(`Sin credenciales de ${label}: no se crea.`)
    return
  }
  if (password.length < 10 || password.length > 72) {
    console.error(`La clave de ${label} debe tener entre 10 y 72 caracteres.`)
    process.exitCode = 1
    return
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await upsertUser({ email, passwordHash, displayName, role })
  console.log(`${label} listo: ${email}`)
}

const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD || ''
const adminName = (process.env.ADMIN_NAME || 'Mario Vega').trim()

const clientEmail = (process.env.DEMO_CLIENT_EMAIL || '').trim().toLowerCase()
const clientPassword = process.env.DEMO_CLIENT_PASSWORD || ''
const clientName = (process.env.DEMO_CLIENT_NAME || 'Ana García').trim()

await seedRole({
  email: adminEmail,
  password: adminPassword,
  displayName: adminName,
  role: 'admin',
  label: 'Administrador',
})
await seedRole({
  email: clientEmail,
  password: clientPassword,
  displayName: clientName,
  role: 'client',
  label: 'Cliente',
})

if (process.exitCode === 1) {
  await pool.end()
  process.exit(1)
}

await pool.end()
