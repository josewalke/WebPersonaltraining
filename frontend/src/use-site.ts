import { useContext } from 'react'
import { SiteContext } from './site-context'

export function useSite() {
  const value = useContext(SiteContext)
  if (!value) {
    throw new Error('useSite debe usarse dentro de SiteProvider')
  }
  return value
}
