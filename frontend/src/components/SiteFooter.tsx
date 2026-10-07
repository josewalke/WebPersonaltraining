import { Link } from 'react-router-dom'
import { BrandMark } from './BrandMark'
import { Reveal } from './Reveal'
import { useSite } from '../use-site'

export function SiteFooter() {
  const site = useSite()
  const city =
    site.status === 'ready' && site.data.trainer.city
      ? site.data.trainer.city
      : 'Las Palmas de Gran Canaria'

  return (
    <footer className="mt-[clamp(3rem,6vh,6rem)] border-t border-white/10 pt-10 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))] desk:pb-12">
      <Reveal>
        <div className="page-shell flex flex-col justify-between gap-8 desk:flex-row desk:items-end">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-sm text-ink-soft">
              Entrenamiento personal 1 a 1 en {city} y online. Esta es la web de Power Up.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link to="/aviso-legal" className="underline-offset-4 transition hover:text-ember hover:underline">
              Aviso legal
            </Link>
            <Link to="/privacidad" className="underline-offset-4 transition hover:text-ember hover:underline">
              Privacidad
            </Link>
            <Link to="/contacto" className="underline-offset-4 transition hover:text-ember hover:underline">
              Pedir plaza
            </Link>
          </div>
        </div>
      </Reveal>
    </footer>
  )
}
