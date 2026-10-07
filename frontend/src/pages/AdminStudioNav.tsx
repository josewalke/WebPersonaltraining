import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { usePrefersReducedMotion } from '../use-motion-preference'

type Item = {
  to: string
  label: string
  short: string
  id: 'entrenar' | 'ejercicios' | 'clientes' | 'solicitudes'
}

const EASE = [0.32, 0.72, 0, 1] as const

export function AdminStudioNav({
  clientCount = 0,
  leadCount = 0,
}: {
  clientCount?: number
  leadCount?: number
}) {
  const location = useLocation()
  const reduced = usePrefersReducedMotion()
  const onLibrary = location.pathname.startsWith('/admin/ejercicios')
  const hash = location.hash.replace('#', '')
  const studioTab =
    hash === 'clientes' || hash === 'solicitudes' || hash === 'entrenar' ? hash : 'entrenar'

  const items: Item[] = [
    { id: 'entrenar', to: '/admin#entrenar', label: 'Entrenar', short: 'Entrenar' },
    { id: 'ejercicios', to: '/admin/ejercicios', label: 'Ejercicios', short: 'Fichas' },
    {
      id: 'clientes',
      to: '/admin#clientes',
      label: `Clientes (${clientCount})`,
      short: `Cli. (${clientCount})`,
    },
    {
      id: 'solicitudes',
      to: '/admin#solicitudes',
      label: `Solicitudes (${leadCount})`,
      short: `Sol. (${leadCount})`,
    },
  ]

  return (
    <nav
      aria-label="Administración"
      className="scroll-strip mt-8 flex w-full max-w-full gap-1 overflow-x-auto rounded-full bg-clay p-1 ring-1 ring-white/10"
    >
      {items.map((item) => {
        const active = item.id === 'ejercicios' ? onLibrary : !onLibrary && studioTab === item.id
        return (
          <Link
            key={item.id}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={[
              'tap relative inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3 text-sm whitespace-nowrap sm:px-5',
              active ? 'font-medium text-ink' : 'text-ink-soft hover:text-paper',
            ].join(' ')}
          >
            {active ? (
              reduced ? (
                <span className="brand-fill absolute inset-0 rounded-full" aria-hidden />
              ) : (
                <motion.span
                  layoutId="admin-nav-pill"
                  className="brand-fill absolute inset-0 rounded-full"
                  transition={{ duration: 0.28, ease: EASE }}
                  aria-hidden
                />
              )
            ) : null}
            <span className="relative z-10 sm:hidden">{item.short}</span>
            <span className="relative z-10 hidden sm:inline">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
