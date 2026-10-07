import { GymPhoto } from '../components/GymPhoto'
import { LeadForm } from '../components/LeadForm'
import { Reveal } from '../components/Reveal'
import SplitText from '../components/react-bits/SplitText'
import { usePrefersReducedMotion } from '../use-motion-preference'

export function ContactPage() {
  const reduced = usePrefersReducedMotion()

  return (
    <main className="page-shell grid gap-[clamp(2rem,4vw,3rem)] pt-[clamp(6rem,12vh,8rem)] pb-24 desk:grid-cols-12">
      <Reveal className="desk:col-span-5">
        <p className="text-[11px] tracking-[0.22em] text-ink-soft">pedir plaza</p>
        {reduced ? (
          <h1 className="mt-4 font-display text-[clamp(2rem,3vw+1rem,3.75rem)] text-pretty">
            Cuéntame qué buscas
          </h1>
        ) : (
          <SplitText
            tag="h1"
            text="Cuéntame qué buscas"
            className="mt-4 font-display text-[clamp(2rem,3vw+1rem,3.75rem)] text-pretty"
            textAlign="left"
            splitType="words"
            delay={60}
            duration={0.9}
          />
        )}
        <p className="mt-4 max-w-sm text-[clamp(0.875rem,0.3vw+0.8rem,1rem)] text-ink-soft">
          Un formulario corto. Presencial en Las Palmas de Gran Canaria u online. Si hay hueco, suele
          haber respuesta en 1–2 días laborables. Después, si encaja, el estudio te crea el acceso de
          cliente; no se genera solo al pedir plaza.
        </p>
        <GymPhoto
          src="/media/gym-kettle.jpg"
          alt="Material de fuerza sobre el suelo de caucho de la sala."
          className="mt-10 hidden aspect-[3/4] max-h-80 w-full rounded-[2rem] desk:block"
        />
      </Reveal>
      <Reveal
        className="rounded-[clamp(1.5rem,2vw,2rem)] bg-clay p-[clamp(1.25rem,2.5vw,2rem)] ring-1 ring-white/10 desk:col-span-7"
        delay={0.12}
        x={36}
        y={0}
      >
        <LeadForm />
      </Reveal>
    </main>
  )
}
