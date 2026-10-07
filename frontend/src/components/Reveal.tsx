import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePrefersReducedMotion } from '../use-motion-preference'

const EASE = [0.32, 0.72, 0, 1] as const

export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  x = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  x?: number
}) {
  const reduced = usePrefersReducedMotion()
  if (reduced) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'ul' | 'ol'
}) {
  const reduced = usePrefersReducedMotion()
  const MotionTag = motion[as]
  if (reduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8% 0px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
      }}
    >
      {children}
    </MotionTag>
  )
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  const reduced = usePrefersReducedMotion()
  if (reduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
      }}
    >
      {children}
    </MotionTag>
  )
}

/** Cambio de panel en admin: corto, sin rebote. */
export function SoftSwap({
  panelKey,
  children,
  className,
}: {
  panelKey: string
  children: ReactNode
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  if (reduced) {
    return <div className={className}>{children}</div>
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={panelKey}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/** Solo marketing: app/admin/cliente van sin fade de página. */
export function PageFade({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  const reduced = usePrefersReducedMotion()
  const isApp =
    routeKey.startsWith('/admin') || routeKey === '/cuenta' || routeKey === '/acceso'
  if (reduced || isApp) {
    return <>{children}</>
  }
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
