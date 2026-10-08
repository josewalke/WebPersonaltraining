import { assetUrl } from '../asset-url'
import { LOGO_PATH, BRAND } from '../nav'

export function BrandMark({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <img
      src={assetUrl(LOGO_PATH)}
      srcSet={`${assetUrl('/brand/power-up-logo-400.webp')} 400w, ${assetUrl(LOGO_PATH)} 806w`}
      sizes={compact ? '60px' : '130px'}
      alt={BRAND}
      width={806}
      height={600}
      className={[compact ? 'h-11 w-auto object-contain' : 'h-24 w-auto object-contain', className].join(' ')}
    />
  )
}
