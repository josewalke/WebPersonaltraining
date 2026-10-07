const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LEAD_STATUSES = new Set(['nuevo', 'contactado', 'ganado', 'perdido'])

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseLoginBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const email = asTrimmedString(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    return { ok: false, error: 'Email o contraseña no válidos.' }
  }
  if (password.length < 10 || password.length > 72) {
    return { ok: false, error: 'Email o contraseña no válidos.' }
  }
  return { ok: true, value: { email, password } }
}

export function parseCreateClientBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const displayName = asTrimmedString(body.displayName)
  const email = asTrimmedString(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  if (displayName.length < 2 || displayName.length > 120) {
    return { ok: false, error: 'Indica un nombre (entre 2 y 120 caracteres).' }
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    return { ok: false, error: 'Indica un email válido.' }
  }
  if (password.length < 10 || password.length > 72) {
    return { ok: false, error: 'La contraseña debe tener entre 10 y 72 caracteres.' }
  }
  return { ok: true, value: { displayName, email, password } }
}

export function parseLeadStatusBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }
  const status = asTrimmedString(body.status)
  if (!LEAD_STATUSES.has(status)) {
    return { ok: false, error: 'Estado no válido.' }
  }
  return { ok: true, value: { status } }
}

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}
