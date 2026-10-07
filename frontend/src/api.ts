export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T
  if (!response.ok) {
    throw new Error(body.error ?? 'No se ha podido completar la acción.')
  }
  return body
}
