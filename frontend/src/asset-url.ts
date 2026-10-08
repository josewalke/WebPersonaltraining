/** Prefija rutas públicas con `import.meta.env.BASE_URL` (necesario en GitHub Pages). */
export function assetUrl(path: string | null | undefined): string {
  if (!path) {
    return ''
  }
  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path
  }
  const base = import.meta.env.BASE_URL
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}
