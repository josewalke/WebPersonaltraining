import { GymPhoto } from '../components/GymPhoto'
import { Reveal, Stagger, StaggerItem } from '../components/Reveal'
import SpotlightCard from '../components/react-bits/SpotlightCard'
import { useSite } from '../use-site'

export function ResultsPage() {
  const site = useSite()

  return (
    <main className="mx-auto w-[min(100%-2*clamp(1rem,3.5vw,2rem),56rem)] pt-[clamp(6rem,12vh,8rem)] pb-24">
      <Reveal>
        <p className="text-[11px] tracking-[0.22em] text-ink-soft">resultados</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,4vw+0.75rem,4.5rem)] text-pretty">
          Lo que se nota
        </h1>
        <p className="mt-4 max-w-lg text-[clamp(0.875rem,0.3vw+0.8rem,1rem)] text-ink-soft">
          El progreso se entiende con registros y contexto. Los testimonios se publican solo con autorización.
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <GymPhoto
          src="/media/gym-bench.jpg"
          alt="Banco de entrenamiento en una sala oscura, lista para una sesión."
          className="mt-10 aspect-[16/9] w-full rounded-[clamp(1.5rem,2vw,2rem)]"
        />
      </Reveal>
      {site.status === 'loading' ? (
        <div className="mt-12 h-48 animate-pulse rounded-[2rem] bg-clay ring-1 ring-white/10" aria-hidden />
      ) : site.status === 'ready' && site.data.testimonials.length > 0 ? (
        <Stagger as="ul" className="mt-12 grid gap-8">
          {site.data.testimonials.map((item) => (
            <StaggerItem as="li" key={item.id}>
              <SpotlightCard
                className="border-white/10 bg-clay p-[clamp(1.5rem,3vw,3rem)]"
                spotlightColor="rgba(46, 124, 240, 0.28)"
              >
                <blockquote className="relative font-display text-[clamp(1.35rem,2vw+0.5rem,2.25rem)] leading-snug">
                  “{item.quote}”
                </blockquote>
                <p className="relative mt-6 text-sm tracking-[0.18em] text-ink-soft uppercase">
                  {item.authorName}
                </p>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <p className="mt-12 text-ink-soft">
          Aún no hay casos publicados. Cuando un cliente autorice su testimonio, aparecerá aquí.
        </p>
      )}
      <Reveal className="mt-12 border-t border-white/15 pt-8">
        <h2 className="font-display text-3xl">Qué puedes seguir en tu plan</h2>
        <dl className="mt-6 grid gap-6">
          <div><dt className="text-ember">Constancia</dt><dd className="mt-2 text-ink-soft">Sesiones y ejercicios marcados como hechos o no hechos, organizados por día. El historial permite volver a las semanas guardadas.</dd></div>
          <div><dt className="text-ember">Evolución de la dosis</dt><dd className="mt-2 text-ink-soft">Series, repeticiones, duración o distancia y descansos. Las copias semanales conservan la dosis registrada en ese momento.</dd></div>
          <div><dt className="text-ember">Contexto técnico</dt><dd className="mt-2 text-ink-soft">Las notas del entrenador ayudan a interpretar lo que toca practicar. Una cifra aislada no cuenta toda la sesión.</dd></div>
        </dl>
      </Reveal>
    </main>
  )
}
