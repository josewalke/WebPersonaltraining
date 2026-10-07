import { Link } from 'react-router-dom'
import { ArrowUpRight } from '@phosphor-icons/react'
import { GymPhoto } from '../components/GymPhoto'
import { Reveal, Stagger, StaggerItem } from '../components/Reveal'
import CircularText from '../components/react-bits/CircularText'
import SplitText from '../components/react-bits/SplitText'
import { usePrefersReducedMotion } from '../use-motion-preference'
import { useSite } from '../use-site'

export function HomePage() {
  const site = useSite()
  const reduced = usePrefersReducedMotion()
  const bio =
    site.status === 'ready'
      ? (site.data.trainer.bio ?? 'Entrenamiento personal sin ruido.')
      : 'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online.'
  const trainerName = site.status === 'ready' ? site.data.trainer.displayName : 'Power Up'
  const city =
    site.status === 'ready' && site.data.trainer.city
      ? site.data.trainer.city
      : 'Las Palmas de Gran Canaria'
  const headline = 'Entrena con\nalguien que te\nmira de\u00A0verdad.'

  return (
    <main>
      {/* Fondo a todo el ancho; contenido con page-shell. Composición fija desde desk. */}
      <section className="relative isolate min-h-[100dvh] overflow-hidden bg-ink text-paper">
        <GymPhoto
          src="/media/gym-hero.jpg"
          alt="Sala de entrenamiento personal con rack y barra, vacía, luz cálida y fría."
          framed={false}
          priority
          className="absolute inset-0 h-full w-full scale-105 object-cover"
        />
        <div className="absolute inset-0 bg-ink/25" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" aria-hidden />
        {/* Cubre el borde inferior de la foto para no dejar un hilo claro al pasar de sección. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 bg-gradient-to-t from-ink from-40% to-transparent" aria-hidden />

        <img
          src="/media/trainer-1.png"
          alt={`${trainerName}, entrenador personal en ${city}.`}
          width={446}
          height={994}
          className="pointer-events-none absolute right-[clamp(-1.5rem,2vw,2.5rem)] bottom-0 z-[2] h-[clamp(20rem,72dvh,52rem)] w-auto max-w-none select-none object-contain object-bottom max-desk:right-[-12%] max-desk:opacity-45"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        <div className="page-shell home-hero-content relative z-10 grid min-h-[100dvh] items-end gap-[clamp(1.25rem,2.5vw,2rem)] pt-[clamp(6rem,12vh,8rem)] pb-[clamp(2.5rem,5vh,4rem)] desk:grid-cols-12">
          <div className="desk:col-span-8">
            <Reveal delay={0.05} y={16}>
              <p className="mb-[clamp(0.75rem,1.5vw,1.5rem)] text-sm tracking-[0.28em] text-paper/70">
                {trainerName} · {city} · 1 : 1
              </p>
            </Reveal>
            {reduced ? (
              <h1 className="home-hero-heading font-display">
                {headline}
              </h1>
            ) : (
              <SplitText
                tag="h1"
                text={headline}
                className="home-hero-heading font-display"
                textAlign="left"
                splitType="words"
                delay={70}
                duration={1.05}
                from={{ opacity: 0, y: 48 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.2}
                rootMargin="-20px"
              />
            )}
          </div>
          <Reveal
            className="flex flex-col items-start gap-[clamp(1.25rem,2.5vw,2rem)] desk:col-span-4 desk:items-end"
            delay={0.15}
            y={36}
          >
            <div className="hidden desk:block" aria-hidden>
              <CircularText
                text="POWER UP · LAS PALMAS · 1A1 · ONLINE · "
                spinDuration={28}
                onHover="slowDown"
                className="font-sans text-[11px] font-medium tracking-[0.35em] text-paper"
              />
            </div>
            <p className="max-w-xs text-paper/80 desk:text-right">{bio}</p>
            <Link
              id="hero-cta"
              to="/contacto"
              className="tap group inline-flex items-center gap-3 rounded-full brand-fill py-3 pr-2 pl-6 text-ink"
              viewTransition
            >
              Pedir plaza
              <span className="grid size-9 place-items-center rounded-full bg-ink/20 text-ink transition duration-500 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-px group-active:scale-95">
                <ArrowUpRight weight="light" className="size-4" aria-hidden />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="page-shell grid items-start gap-[clamp(2rem,4vw,2.5rem)] py-[clamp(4rem,8vh,7rem)] desk:grid-cols-12">
        <Reveal className="desk:col-span-5">
          <GymPhoto
            src="/media/gym-kettle.jpg"
            alt="Pesa rusa y mancuernas sobre suelo de caucho negro."
            className="aspect-[3/4] max-h-[32rem] w-full rounded-[2rem]"
          />
          <h2 className="mt-8 font-display text-[clamp(2rem,2.5vw+1rem,3rem)] text-pretty">
            Tres tiempos. Ningún humo.
          </h2>
        </Reveal>
        <div className="flex h-full flex-col desk:col-span-7">
          <Stagger as="ol" className="grid gap-2">
            {[
              'Cuéntame objetivo y disponibilidad.',
              'Diseño un plan 1 a 1 en Las Palmas o online.',
              'Ajustamos cada semana según cómo entrenas.',
            ].map((step, index) => (
              <StaggerItem
                as="li"
                key={step}
                className="interactive-row grid grid-cols-[clamp(3.25rem,4vw,4rem)_1fr] items-center gap-x-[clamp(0.75rem,2vw,1.25rem)] rounded-2xl px-[clamp(1rem,2vw,1.25rem)] py-5"
              >
                <span className="font-display text-4xl leading-none brand-text tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-[clamp(1rem,0.4vw+0.9rem,1.125rem)] leading-snug text-ink-soft">{step}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.1}>
            <Link
              to="/entrenador"
              className="mt-8 inline-flex text-ember underline-offset-4 transition hover:underline"
              viewTransition
            >
              Conoce al entrenador →
            </Link>
          </Reveal>
          <Reveal className="mt-10 border-t border-white/15 pt-8" delay={0.15}>
            <p className="text-[11px] tracking-[0.22em] text-ember">TU SEMANA, TU PLAN</p>
            <h3 className="mt-3 max-w-[22ch] font-display text-[clamp(2rem,2.5vw,3rem)] leading-[1.15] text-pretty">
              No necesitas hacerlo solo.
            </h3>
            <p className="mt-4 max-w-[48ch] text-[clamp(1rem,0.4vw+0.9rem,1.125rem)] leading-relaxed text-paper/75">
              Un objetivo claro, atención a la técnica y ajustes cada semana. En Las Palmas o a
              distancia, el trabajo se adapta a cómo entrenas y al tiempo que tienes.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                to="/contacto"
                className="tap group inline-flex min-h-12 items-center gap-3 rounded-full brand-fill py-3 pr-2 pl-6 text-ink"
                viewTransition
              >
                Cuéntame tu objetivo
                <span className="grid size-9 place-items-center rounded-full bg-ink/20 transition duration-500 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <ArrowUpRight weight="light" className="size-4" aria-hidden />
                </span>
              </Link>
              <Link
                to="/servicios"
                className="inline-flex min-h-12 items-center gap-2 text-paper/80 underline-offset-4 transition hover:text-ember hover:underline"
                viewTransition
              >
                Ver modalidades
                <ArrowUpRight weight="light" className="size-4" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
