import { LOGO_SRC, BRAND } from '../nav'

export function BrandMark({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <img
      src={LOGO_SRC}
      alt={BRAND}
      className={[compact ? 'h-11 w-auto object-contain' : 'h-24 w-auto object-contain', className].join(' ')}
    />
  )
}
