export const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/entrenador', label: 'Entrenador' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/contacto', label: 'Pedir plaza' },
] as const

export const BRAND = 'Power Up'
export const LOGO_PATH = '/brand/power-up-logo.webp'
/** @deprecated Usa LOGO_PATH + assetUrl; se mantiene por compatibilidad. */
export const LOGO_SRC = '/brand/power-up-logo.webp'
