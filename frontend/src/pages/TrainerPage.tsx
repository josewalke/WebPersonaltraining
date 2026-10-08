import { Link } from 'react-router-dom'
import { ArrowUpRight } from '@phosphor-icons/react'
import { assetUrl } from '../asset-url'
import { GymPhoto } from '../components/GymPhoto'
import SplitText from '../components/react-bits/SplitText'
import { Reveal, Stagger, StaggerItem } from '../components/Reveal'
import { usePrefersReducedMotion } from '../use-motion-preference'
import { useSite } from '../use-site'

const METHOD = [
  {
    title: 'Presencia',
    text: 'En Las Palmas o en videollamada, la sesión es tuya. No hay clases de 20 personas ni PDFs genéricos.',
  },
  {
    title: 'Progresión',
    text: 'Cargas, descansos y técnica se revisan. Si una semana no sale, el plan cambia; no se ignora.',
  },
  {
    title: 'Contexto',
    text: 'Sueño, trabajo, lesiones previas. Entreno personas, no capturas de pantalla de ejercicios.',
  },
]

export function TrainerPage() {
  const site = useSite()
  const reduced = usePrefersReducedMotion()

  const brand = site.status === 'ready' ? site.data.trainer.displayName : 'Power Up'
  const personName =
    site.status === 'ready' ? site.data.trainer.personName?.trim() || null : null
  const city =
    site.status === 'ready' && site.data.trainer.city
      ? site.data.trainer.city
      : 'Las Palmas de Gran Canaria'
  const tagline =
    site.status === 'ready'
      ? (site.data.trainer.tagline ?? site.data.trainer.bio)
      : 'Entrenamiento personal 1 a 1 en Las Palmas de Gran Canaria y online.'
  const story =
    site.status === 'ready'
      ? (site.data.trainer.story ?? site.data.trainer.bio)
      : null
  const configuredPhoto = site.status === 'ready' ? site.data.trainer.photoUrl?.trim() : null
  const bundledPhotos = ['/media/trainer-2.png', '/media/trainer-bench.png', '/media/trainer-hero.png']
  const photoPath =
    !configuredPhoto || bundledPhotos.includes(configuredPhoto.split('?')[0])
      ? '/media/trainer-bench-hq.webp'
      : configuredPhoto
  const photoUrl = assetUrl(photoPath)
  const photoSrcSet =
    photoPath === '/media/trainer-bench-hq.webp'
      ? `${assetUrl('/media/trainer-bench-640.webp')} 640w, ${assetUrl('/media/trainer-bench-hq.webp')} 1122w`
      : undefined
  const credentials =
    site.status === 'ready' ? site.data.trainer.credentials.filter(Boolean) : []
  const publicName = personName ?? brand

  return (
    <main>
      <section className="relative isolate min-h-[min(100dvh,52rem)] overflow-hidden bg-ink text-paper">
        <GymPhoto
          src="/media/gym-plates.jpg"
          alt={`Sala de entrenamiento de ${brand} en ${city}.`}
          framed={false}
          priority
          className="absolute inset-0 h-full w-full scale-105 object-cover"
        />
        <div className="absolute inset-0 bg-ink/35" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 bg-gradient-to-t from-ink from-40% to-transparent"
          aria-hidden
        />

        <div className="trainer-profile-photo-wrap pointer-events-none absolute right-[clamp(-0.5rem,1vw,1.5rem)] bottom-0 z-[2] hidden h-[clamp(24rem,82dvh,48rem)] desk:block">
          <img
            src={photoUrl}
            srcSet={photoSrcSet}
            sizes="(max-width: 1023px) 350px, 650px"
            alt={`${publicName}, entrenador personal de ${brand} en ${city}, sentado en un banco de entrenamiento.`}
            width={1122}
            height={1402}
            className="portrait-silhouette block h-full w-auto max-w-none select-none object-contain object-bottom"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>

        <div className="page-shell relative z-10 grid min-h-[min(100dvh,52rem)] items-end gap-[clamp(1.25rem,2.5vw,2rem)] pt-[clamp(6rem,12vh,8rem)] pb-[clamp(2.5rem,5vh,4rem)] desk:grid-cols-12">
          <div className="desk:col-span-8">
            <Reveal delay={0.05} y={16}>
              <p className="mb-4 text-sm tracking-[0.28em] text-paper/70">
                {brand} · {city}
              </p>
            </Reveal>
            {reduced ? (
              <h1 className="max-w-[12ch] font-display text-[clamp(2.5rem,5.2vw+0.6rem,6.4rem)] leading-[1.12] text-pretty">
                {publicName}
              </h1>
            ) : (
              <SplitText
                tag="h1"
                text={publicName}
                className="max-w-[12ch] font-display text-[clamp(2.5rem,5.2vw+0.6rem,6.4rem)] leading-[1.12] text-pretty"
                textAlign="left"
                splitType="words"
                delay={60}
                duration={0.95}
                from={{ opacity: 0, y: 36 }}
                to={{ opacity: 1, y: 0 }}
              />
            )}
          </div>
          <div className="flex justify-center desk:hidden">
            <div className="trainer-profile-photo-wrap h-[clamp(18rem,48dvh,28rem)]">
              <img src={photoUrl}
            srcSet={photoSrcSet}
            sizes="(max-width: 1023px) 350px, 650px" alt={`Retrato de ${publicName}, sentado en un banco de entrenamiento.`} width={1122} height={1402} className="portrait-silhouette block h-full w-auto max-w-full object-contain" loading="eager" decoding="async" />
            </div>
          </div>
          <Reveal
            className="flex flex-col items-start gap-6 desk:col-span-4 desk:items-end"
            delay={0.15}
            y={28}
          >
            <p className="max-w-xs text-paper/85 desk:text-right">{tagline}</p>
            <Link
              id="hero-cta"
              to="/contacto"
              className="tap group inline-flex items-center gap-3 rounded-full brand-fill py-3 pr-2 pl-6 text-ink"
              viewTransition
            >
              Pedir plaza
              <span className="grid size-9 place-items-center rounded-full bg-ink/20 transition duration-500 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-px group-active:scale-95">
                <ArrowUpRight weight="light" className="size-4" aria-hidden />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {story || credentials.length > 0 ? (
        <section className="page-shell grid gap-[clamp(2rem,4vw,3rem)] py-[clamp(3.5rem,7vh,5rem)] desk:grid-cols-12">
          <Reveal className="desk:col-span-5">
            <p className="text-[11px] tracking-[0.22em] text-ink-soft">quién entrena</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,2.5vw+1rem,3rem)] text-pretty">
              {personName ? `Sobre ${personName.split(' ')[0]}` : 'El estudio'}
            </h2>
            <img
              src={photoUrl}
            srcSet={photoSrcSet}
            sizes="(max-width: 1023px) 350px, 650px"
              alt={`Retrato de ${publicName}.`}
              width={1122}
              height={1402}
              className="mt-8 mx-auto max-h-[28rem] max-w-full w-auto object-contain desk:hidden"
              loading="lazy"
              decoding="async"
            />
          </Reveal>
          <div className="desk:col-span-7">
            {story ? (
              <Reveal delay={0.08}>
                <p className="max-w-xl text-lg leading-relaxed text-ink-soft">{story}</p>
              </Reveal>
            ) : null}
            {credentials.length > 0 ? (
              <Reveal delay={0.14}>
                <h3 className="mt-10 text-sm tracking-[0.18em] text-ink-soft uppercase">
                  Formación y enfoque
                </h3>
                <ul className="mt-4 grid gap-3">
                  {credentials.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-ember/70 pl-4 text-paper/90"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}

      <section aria-label="Cómo trabajo" className="border-y border-white/10">
        <div className="page-shell pt-[clamp(2.5rem,5vh,4rem)]">
          <Reveal>
            <p className="text-[11px] tracking-[0.22em] text-ink-soft">el método</p>
            <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(2rem,3vw+1rem,3.75rem)] text-pretty">
              Sin grupo. Sin plantilla. Tú.
            </h2>
          </Reveal>
        </div>
        <Stagger as="ol" className="page-shell">
          {METHOD.map((item, index) => (
            <StaggerItem
              as="li"
              key={item.title}
              className="interactive-row -mx-3 grid gap-4 rounded-2xl border-b border-white/10 px-3 py-[clamp(2rem,4vh,4rem)] last:border-b-0 desk:grid-cols-12 desk:items-baseline desk:gap-8"
            >
              <span className="font-display text-[clamp(1.75rem,2vw+0.5rem,2.25rem)] brand-text desk:col-span-2">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-[clamp(2rem,3vw+0.5rem,3.75rem)] leading-none desk:col-span-4">
                {item.title}
              </h3>
              <p className="max-w-md text-lg text-ink-soft desk:col-span-6 desk:justify-self-end desk:text-right">
                {item.text}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="page-shell pt-[clamp(2.5rem,5vh,4rem)] pb-8">
        <Reveal>
          <div className="grid gap-8 rounded-[clamp(1.5rem,2vw,2rem)] bg-clay px-[clamp(1.25rem,3vw,2.5rem)] py-[clamp(2rem,4vh,3.5rem)] ring-1 ring-white/10 desk:grid-cols-12 desk:items-end">
            <h2 className="max-w-[16ch] font-display text-[clamp(1.75rem,2.5vw+0.75rem,3rem)] leading-[1.12] text-pretty desk:col-span-7">
              Las Palmas u online. La misma sesión: tuya.
            </h2>
            <div className="desk:col-span-5">
              <p className="max-w-sm text-ink-soft">
                Misma exigencia, en sala en Gran Canaria o a distancia. Si hay hueco, te escribo.
              </p>
              <Link
                to="/contacto"
                className="mt-6 inline-flex text-ember underline-offset-4 transition hover:underline"
                viewTransition
              >
                Ver si hay plaza →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
