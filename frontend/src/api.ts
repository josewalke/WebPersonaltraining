import { isLocalDataMode } from './local-db'
import { localApi } from './local-api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isLocalDataMode()) {
    return localApi<T>(path, options)
  }

  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  let response: Response
  try {
    response = await fetch(path, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(15000),
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError('No se puede conectar con el servidor. Revisa la conexión y vuelve a intentarlo.', 0)
  }
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('session-expired'))
    }
    throw new ApiError(body.error ?? 'No se ha podido completar la acción.', response.status)
  }
  return body
}
