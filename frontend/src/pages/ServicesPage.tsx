import { Link } from 'react-router-dom'
import { GymPhoto } from '../components/GymPhoto'
import { Reveal, Stagger, StaggerItem } from '../components/Reveal'
import SpotlightCard from '../components/react-bits/SpotlightCard'
import { useSite } from '../use-site'
import type { Service } from '../types'

const SERVICE_MEDIA = [
  {
    src: '/media/gym-bench.jpg',
    alt: 'Banco y poleas en una sala de entrenamiento 1 a 1.',
  },
  {
    src: '/media/gym-plates.jpg',
    alt: 'Discos de peso listos junto a la barra.',
  },
] as const

const MODALITY_LABEL = {
  presencial: 'Las Palmas',
  online: 'Online',
  hibrido: 'Híbrido',
} as const

function formatPrice(service: Service) {
  if (service.priceCents == null) return null
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: service.currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(service.priceCents / 100)
}

function contactPath(service: Service) {
  const modality =
    service.modality === 'hibrido' ? 'indiferente' : service.modality
  return `/contacto?modalidad=${modality}`
}

export function ServicesPage() {
  const site = useSite()

  return (
    <main className="page-shell pt-[clamp(6rem,12vh,8rem)] pb-24">
      <Reveal>
        <p className="text-[11px] tracking-[0.22em] text-ink-soft">servicios</p>
        <h1 className="mt-4 max-w-[8ch] font-display text-[clamp(2.5rem,6vw+0.5rem,6rem)] text-pretty">
          Solo 1 a 1
        </h1>
        <p className="mt-4 max-w-md text-[clamp(0.875rem,0.3vw+0.8rem,1rem)] text-ink-soft">
          Un formato, dos maneras de estar: en Las Palmas de Gran Canaria o a distancia. Sin grupos, sin
          packs confusos. Precios orientativos por sesión.
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <GymPhoto
          src="/media/gym-bench.jpg"
          alt="Banco y poleas en una sala de entrenamiento 1 a 1."
          className="mt-[clamp(2rem,4vh,3rem)] aspect-[16/9] w-full rounded-[clamp(1.5rem,2vw,2rem)]"
        />
      </Reveal>
      {site.status === 'loading' ? (
        <ul className="mt-16 grid gap-8 desk:grid-cols-2" aria-hidden>
          <li className="min-h-[280px] animate-pulse rounded-[2rem] bg-clay ring-1 ring-white/10" />
          <li className="min-h-[280px] animate-pulse rounded-[2rem] bg-clay ring-1 ring-white/10 desk:mt-16" />
        </ul>
      ) : site.status === 'ready' && site.data.services.length > 0 ? (
        <Stagger as="ul" className="mt-16 grid gap-8 desk:grid-cols-2">
          {site.data.services.map((service, index) => {
            const price = formatPrice(service)
            return (
              <StaggerItem as="li" key={service.id} className={index === 1 ? 'desk:mt-16' : undefined}>
                <GymPhoto
                  src={SERVICE_MEDIA[index % SERVICE_MEDIA.length].src}
                  alt={SERVICE_MEDIA[index % SERVICE_MEDIA.length].alt}
                  className="mb-4 aspect-[4/3] w-full rounded-[2rem]"
                />
                <SpotlightCard
                  className="min-h-[280px] border-white/10 bg-clay p-8 text-paper transition duration-500 ease-soft hover:-translate-y-1"
                  spotlightColor="rgba(255, 140, 26, 0.4)"
                >
                  <p className="relative text-[11px] tracking-[0.22em] text-paper/60">
                    {MODALITY_LABEL[service.modality]}
                    {service.durationMinutes ? ` · ${service.durationMinutes} min` : ''}
                  </p>
                  <h2 className="relative mt-6 font-display text-[clamp(1.75rem,1.5vw+1rem,2.25rem)]">
                    {service.name}
                  </h2>
                  <p className="relative mt-4 max-w-sm text-paper/75">{service.description}</p>
                  {price ? (
                    <p className="relative mt-5 font-display text-2xl text-ember">
                      Desde {price}
                      <span className="ml-2 font-sans text-sm tracking-normal text-ink-soft">/ sesión</span>
                    </p>
                  ) : null}
                  <Link
                    to={contactPath(service)}
                    className="relative mt-6 inline-flex text-ember underline-offset-4 transition hover:underline"
                    viewTransition
                  >
                    Pedir esta modalidad →
                  </Link>
                </SpotlightCard>
              </StaggerItem>
            )
          })}
        </Stagger>
      ) : (
        <p className="mt-16 text-ink-soft">Los servicios se mostrarán en cuanto haya conexión con el estudio.</p>
      )}
    </main>
  )
}
