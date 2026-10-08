import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, List, X } from '@phosphor-icons/react'
import { BrandMark } from './BrandMark'
import { BRAND, NAV_LINKS } from '../nav'
import { AnimatePresence, motion } from 'motion/react'
import { usePrefersReducedMotion } from '../use-motion-preference'
import { useAuth } from '../auth-context'

export function IslandNav() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const menuId = useId()
  const reduced = usePrefersReducedMotion()
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    setOpen(false)
    setHidden(false)
    lastScrollY.current = window.scrollY
  }, [location.pathname])

  useEffect(() => {
    if (!open) {
      return
    }
    firstLinkRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      if (open) {
        setHidden(false)
        lastScrollY.current = window.scrollY
        return
      }

      const y = window.scrollY
      const delta = y - lastScrollY.current

      if (y < 56) {
        setHidden(false)
      } else if (delta > 10) {
        setHidden(true)
      } else if (delta < -10) {
        setHidden(false)
      }

      lastScrollY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open])

  return (
    <header
      className={[
        'pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-[max(1.25rem,env(safe-area-inset-top))] transition duration-300 ease-soft sm:pt-5',
        hidden ? '-translate-y-[120%] opacity-0' : 'translate-y-0 opacity-100',
      ].join(' ')}
      aria-hidden={hidden && !open}
    >
      <motion.div
        className={[
          'page-shell relative z-30 flex items-center justify-between gap-2 sm:gap-3',
          hidden && !open ? 'pointer-events-none' : 'pointer-events-auto',
        ].join(' ')}
        initial={reduced ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      >
        <Link to="/" aria-label={BRAND} className="tap block" viewTransition>
          <BrandMark compact />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full bg-clay/80 p-1.5 ring-1 ring-white/10 backdrop-blur-md md:flex"
          aria-label="Principal"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  'tap rounded-full px-4 py-2 text-sm',
                  isActive ? 'brand-fill text-ink' : 'text-ink-soft hover:bg-white/5 hover:text-paper',
                ].join(' ')
              }
              end={link.to === '/'}
              viewTransition
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {auth.user ? (
            <>
              <Link
                to={auth.user.role === 'admin' ? '/admin' : '/cuenta'}
                className="tap rounded-full bg-clay px-4 py-2 text-sm ring-1 ring-white/10"
              >
                {auth.user.role === 'admin' ? 'Estudio' : 'Mi cuenta'}
              </Link>
              <button
                type="button"
                className="tap text-sm text-ink-soft hover:text-paper"
                onClick={() => {
                  navigate('/')
                  void auth.logout()
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/acceso" viewTransition className="tap text-sm text-ink-soft hover:text-paper">
                Acceso
              </Link>
              <Link
                to="/contacto"
                viewTransition
                className="tap group inline-flex min-h-10 items-center gap-2 rounded-full brand-fill py-2 pr-2 pl-5 text-sm font-medium text-ink"
              >
                Pedir plaza
                <span className="grid size-8 place-items-center rounded-full bg-ink/20 transition duration-500 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <ArrowUpRight weight="light" className="size-4" aria-hidden />
                </span>
              </Link>
            </>
          )}
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="tap grid size-12 place-items-center rounded-full bg-clay text-paper ring-1 ring-white/10 md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="dialog"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X weight="light" className="size-6" /> : <List weight="light" className="size-6" />}
          <span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu"
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-auto fixed inset-0 z-20 overflow-y-auto bg-ink/94 px-6 pt-[max(7rem,calc(env(safe-area-inset-top)+6rem))] pb-[max(2rem,env(safe-area-inset-bottom))] text-paper backdrop-blur-md md:hidden"
          >
            <nav aria-label="Móvil" className="flex flex-col gap-1">
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={reduced ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                >
                  <NavLink
                    ref={index === 0 ? firstLinkRef : undefined}
                    to={link.to}
                    className={({ isActive }) =>
                      ['rounded-xl py-2 font-display text-3xl sm:text-4xl', isActive ? 'brand-text' : 'text-paper'].join(' ')
                    }
                    onClick={() => setOpen(false)}
                    viewTransition
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              {auth.user ? (
                <>
                  <NavLink
                    to={auth.user.role === 'admin' ? '/admin' : '/cuenta'}
                    className="rounded-xl py-2 font-display text-4xl"
                    onClick={() => setOpen(false)}
                  >
                    {auth.user.role === 'admin' ? 'Estudio' : 'Mi cuenta'}
                  </NavLink>
                  <button
                    type="button"
                    className="mt-4 text-left font-display text-3xl text-ink-soft"
                    onClick={() => {
                      setOpen(false)
                      navigate('/')
                      void auth.logout()
                    }}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <NavLink
                  to="/acceso"
                  className="rounded-xl py-2 font-display text-4xl"
                  onClick={() => setOpen(false)}
                >
                  Acceso
                </NavLink>
              )}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
