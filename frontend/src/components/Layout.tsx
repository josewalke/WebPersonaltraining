import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { usePrefersReducedMotion } from '../use-motion-preference'
import { useSite } from '../use-site'
import { IslandNav } from './IslandNav'
import { MobileCta } from './MobileCta'
import ClickSpark from './react-bits/ClickSpark'
import { PageFade } from './Reveal'
import { SiteFooter } from './SiteFooter'

const DEFAULT_DESCRIPTION =
  'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online. Un método claro, seguimiento cercano y plaza limitada.'

const SITE_URL = String(import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '')

const PAGE_META: Record<string, { title: string; description: string; robots?: string }> = {
  '/': {
    title: 'Power Up — Entrenamiento personal',
    description: DEFAULT_DESCRIPTION,
  },
  '/entrenador': {
    title: 'Entrenador — Power Up',
    description:
      'Conoce al entrenador de Power Up: entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria u online.',
  },
  '/servicios': {
    title: 'Servicios — Power Up',
    description:
      'Entrenamiento personal presencial en Las Palmas, online y valoración inicial. Precios orientativos por sesión.',
  },
  '/resultados': {
    title: 'Resultados — Power Up',
    description:
      'Casos reales de clientes de Power Up en Las Palmas de Gran Canaria y online, publicados con su permiso.',
  },
  '/contacto': {
    title: 'Pedir plaza — Power Up',
    description:
      'Solicita plaza de entrenamiento personal en Las Palmas de Gran Canaria u online. Respuesta habitual en 1–2 días laborables.',
  },
  '/acceso': {
    title: 'Acceso — Power Up',
    description: 'Entra a tu espacio de cliente o al estudio de Power Up.',
    robots: 'noindex,nofollow',
  },
  '/admin': {
    title: 'Estudio — Power Up',
    description: 'Panel del estudio Power Up.',
    robots: 'noindex,nofollow',
  },
  '/admin/ejercicios': {
    title: 'Ejercicios — Power Up',
    description: 'Biblioteca de ejercicios del estudio Power Up.',
    robots: 'noindex,nofollow',
  },
  '/cuenta': {
    title: 'Mi cuenta — Power Up',
    description: 'Tu plan semanal de entrenamiento Power Up.',
    robots: 'noindex,nofollow',
  },
  '/aviso-legal': {
    title: 'Aviso legal — Power Up',
    description: 'Aviso legal del sitio Power Up, entrenamiento personal en Las Palmas de Gran Canaria.',
  },
  '/privacidad': {
    title: 'Privacidad — Power Up',
    description:
      'Política de privacidad de Power Up: tratamiento de datos de solicitudes de plaza y cuentas de cliente.',
  },
}

function ensureMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function ensureLink(rel: string, href: string | null) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function Layout() {
  const location = useLocation()
  const site = useSite()
  const reduced = usePrefersReducedMotion()
  const meta = PAGE_META[location.pathname] ?? {
    title: 'Power Up — Entrenamiento personal',
    description: DEFAULT_DESCRIPTION,
  }

  useEffect(() => {
    document.title = meta.title
    ensureMeta('name', 'description', meta.description)
    ensureMeta('name', 'robots', meta.robots ?? 'index,follow')
    ensureMeta('property', 'og:title', meta.title)
    ensureMeta('property', 'og:description', meta.description)
    ensureMeta('property', 'og:type', 'website')
    ensureMeta('name', 'twitter:card', 'summary_large_image')
    ensureMeta('name', 'twitter:title', meta.title)
    ensureMeta('name', 'twitter:description', meta.description)
    const canonical = SITE_URL ? `${SITE_URL}${location.pathname === '/' ? '' : location.pathname}` : null
    ensureLink('canonical', canonical)
    if (SITE_URL) {
      ensureMeta('property', 'og:url', canonical ?? SITE_URL)
    }
  }, [location.pathname, meta.description, meta.robots, meta.title])

  const isAppShell =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/cuenta' ||
    location.pathname === '/acceso'

  const tree = (
    <>
      <ScrollRestoration />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {meta.title}
      </div>
      <div className="grain" aria-hidden />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-clay focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <IslandNav />
      {site.status === 'error' ? (
        <div
          role="alert"
          className="relative z-20 mx-auto mt-24 flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm"
        >
          <p className="text-ember">{site.message}</p>
          <button
            type="button"
            onClick={site.retry}
            className="tap rounded-full bg-clay px-4 py-2 ring-1 ring-white/15 hover:bg-white/5"
          >
            Reintentar
          </button>
        </div>
      ) : null}
      <div id="contenido" className="scroll-mt-28">
        <PageFade routeKey={location.pathname}>
          <Outlet />
        </PageFade>
      </div>
      <SiteFooter />
      <MobileCta />
    </>
  )

  if (reduced || isAppShell) {
    return tree
  }

  return (
    <ClickSpark sparkColor="#ff8c1a" sparkCount={8} sparkRadius={18} sparkSize={8} duration={320}>
      {tree}
    </ClickSpark>
  )
}
