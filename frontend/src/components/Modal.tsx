import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { usePrefersReducedMotion } from '../use-motion-preference'

const EASE = [0.32, 0.72, 0, 1] as const

export function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!open) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const frame = window.requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    })
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
      window.cancelAnimationFrame(frame)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal-root"
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.22, ease: EASE }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={[
              'relative z-10 flex max-h-[min(92dvh,52rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-clay ring-1 ring-white/12 sm:rounded-[1.75rem]',
              wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
            ].join(' ')}
            initial={reduced ? false : { opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduced ? 0.01 : 0.28, ease: EASE }}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <h2 id={titleId} className="font-display text-2xl text-paper sm:text-3xl">
                {title}
              </h2>
              <button
                type="button"
                className="tap grid size-11 shrink-0 place-items-center rounded-full bg-ink text-ink-soft ring-1 ring-white/10 hover:text-paper"
                aria-label="Cerrar diálogo"
                onClick={onClose}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
