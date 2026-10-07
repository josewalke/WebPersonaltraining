import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { pool } from './db.js'

const SALT_ROUNDS = 12
const SESSION_DAYS = 7
export const COOKIE_NAME = 'pu_session'

export function hashToken(token, secret) {
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url')
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain, passwordHash) {
  return bcrypt.compare(plain, passwordHash)
}

export function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  }
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, email, password_hash, display_name, role, is_active
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  )
  return result.rows[0] ?? null
}

export async function createUser({ email, passwordHash, displayName, role }) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, display_name, role`,
    [email, passwordHash, displayName, role],
  )
  return result.rows[0]
}

export async function upsertUser({ email, passwordHash, displayName, role }) {
  const existing = await findUserByEmail(email)
  if (existing) {
    await pool.query(
      `UPDATE users
       SET password_hash = $2, display_name = $3, role = $4, is_active = true
       WHERE email = $1`,
      [email, passwordHash, displayName, role],
    )
    return findUserByEmail(email)
  }
  return createUser({ email, passwordHash, displayName, role })
}

export async function upsertAdmin({ email, passwordHash, displayName }) {
  return upsertUser({ email, passwordHash, displayName, role: 'admin' })
}

export async function listClients() {
  const result = await pool.query(
    `SELECT id, email, display_name, role, is_active, created_at
     FROM users
     WHERE role = 'client'
     ORDER BY created_at DESC`,
  )
  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  }))
}

export async function listLeads() {
  const result = await pool.query(
    `SELECT id, full_name, email, phone, preferred_modality, message, status, created_at
     FROM leads
     ORDER BY created_at DESC
     LIMIT 100`,
  )
  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    preferredModality: row.preferred_modality,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }))
}

export async function updateLeadStatus(id, status) {
  const result = await pool.query(
    `UPDATE leads SET status = $2 WHERE id = $1 RETURNING id`,
    [id, status],
  )
  return result.rowCount === 1
}

export async function insertSession(userId, tokenHash, expiresAt) {
  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  )
}

export async function findSessionUser(tokenHash) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.role, u.is_active
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()
     LIMIT 1`,
    [tokenHash],
  )
  return result.rows[0] ?? null
}

export async function deleteSession(tokenHash) {
  await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash])
}

export async function deleteExpiredSessions() {
  await pool.query(`DELETE FROM sessions WHERE expires_at <= now()`)
}

export function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
}

export function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  }
}
