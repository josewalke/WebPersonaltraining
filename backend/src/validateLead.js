const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MODALITIES = new Set(['presencial', 'online', 'indiferente'])

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseLeadBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Datos no válidos.' }
  }

  const fullName = asTrimmedString(body.fullName)
  const email = asTrimmedString(body.email).toLowerCase()
  const phone = asTrimmedString(body.phone)
  const preferredModality = asTrimmedString(body.preferredModality)
  const message = asTrimmedString(body.message)
  const privacyAccepted = body.privacyAccepted === true

  if (fullName.length < 2 || fullName.length > 120) {
    return { ok: false, error: 'Indica tu nombre (entre 2 y 120 caracteres).' }
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    return { ok: false, error: 'Indica un email válido.' }
  }
  if (phone.length > 40) {
    return { ok: false, error: 'El teléfono es demasiado largo.' }
  }
  if (!MODALITIES.has(preferredModality)) {
    return { ok: false, error: 'Elige una modalidad.' }
  }
  if (message.length > 2000) {
    return { ok: false, error: 'El mensaje es demasiado largo.' }
  }
  if (!privacyAccepted) {
    return { ok: false, error: 'Necesitamos tu consentimiento de privacidad.' }
  }

  return {
    ok: true,
    value: {
      fullName,
      email,
      phone: phone || null,
      preferredModality,
      message: message || null,
    },
  }
}
