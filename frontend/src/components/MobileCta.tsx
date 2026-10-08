import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

/** CTA fijo móvil: solo cuando el CTA del hero ya no está a la vista. */
export function MobileCta() {
  const location = useLocation()
  const [show, setShow] = useState(false)
  const hidden =
    location.pathname === '/contacto' ||
    location.pathname === '/acceso' ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/cuenta'

  useEffect(() => {
    if (hidden) {
      setShow(false)
      return
    }

    const hero = document.getElementById('hero-cta')
    if (!hero) {
      setShow(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShow(!entry.isIntersecting && entry.boundingClientRect.bottom < 0)
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [hidden, location.pathname])

  if (hidden || !show) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        to="/contacto"
        viewTransition
        className="tap pointer-events-auto flex min-h-12 items-center justify-center rounded-full brand-fill px-6 py-3 text-center font-medium text-ink shadow-[0_-8px_40px_rgba(0,0,0,0.45)]"
      >
        Pedir plaza
      </Link>
    </div>
  )
}
