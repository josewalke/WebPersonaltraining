import { Link } from 'react-router-dom'
import { Reveal } from '../components/Reveal'

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      <Reveal>
        <p className="text-[11px] tracking-[0.22em] text-ink-soft">404</p>
        <h1 className="mt-4 font-display text-4xl text-pretty sm:text-5xl md:text-7xl">Esta página no existe</h1>
        <p className="mt-4 max-w-md text-sm text-ink-soft sm:text-base">
          El enlace no coincide con ninguna sección. Vuelve al inicio o pide plaza si quieres entrenar.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            to="/"
            viewTransition
            className="tap inline-flex min-h-12 items-center justify-center rounded-full bg-clay px-5 py-3 ring-1 ring-white/10 hover:bg-white/5"
          >
            Ir al inicio
          </Link>
          <Link
            to="/contacto"
            viewTransition
            className="tap inline-flex min-h-12 items-center justify-center rounded-full brand-fill px-5 py-3 font-medium text-ink"
          >
            Pedir plaza
          </Link>
        </div>
      </Reveal>
    </main>
  )
}
