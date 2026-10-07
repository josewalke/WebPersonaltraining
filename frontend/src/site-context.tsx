import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SiteData } from './types'

type SiteStatus =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: SiteData }

export type SiteState = SiteStatus & { retry: () => void }

export const SiteContext = createContext<SiteState | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteStatus>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/site')
        if (!response.ok) {
          throw new Error('No se ha podido cargar el contenido.')
        }
        const data = (await response.json()) as SiteData
        if (!cancelled) {
          setState({ status: 'ready', data })
        }
      } catch {
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'No se ha podido conectar con el servidor. Revisa que la API esté en marcha.',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [attempt])

  const value = useMemo(() => ({ ...state, retry }), [state, retry])

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
