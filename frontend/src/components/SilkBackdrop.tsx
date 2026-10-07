import { lazy, Suspense } from 'react'
import { useIsDesktop, usePrefersReducedMotion } from '../use-motion-preference'

const Silk = lazy(() => import('./react-bits/Silk'))

export function SilkBackdrop() {
  const reduced = usePrefersReducedMotion()
  const desktop = useIsDesktop()

  if (reduced || !desktop) {
    return <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,#ff8c1a_0%,#0a0a0a_48%,#2e7cf0_100%)]" />
  }

  return (
    <div className="absolute inset-0">
      <Suspense fallback={<div className="h-full bg-ink" />}>
        <Silk color="#ff8c1a" speed={2.2} scale={1.15} noiseIntensity={1.1} rotation={0.4} />
      </Suspense>
    </div>
  )
}
