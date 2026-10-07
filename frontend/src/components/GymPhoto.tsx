type GymPhotoProps = {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  priority?: boolean
  framed?: boolean
}

export function GymPhoto({
  src,
  alt,
  className = '',
  imgClassName = '',
  priority = false,
  framed = true,
}: GymPhotoProps) {
  const image = (
    <img
      src={src}
      alt={alt}
      width={1600}
      height={900}
      className={['h-full w-full object-cover', imgClassName].join(' ')}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )

  if (!framed) {
    return (
      <img
        src={src}
        alt={alt}
        width={1600}
        height={900}
        className={['h-full w-full object-cover', className, imgClassName].join(' ')}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    )
  }

  return (
    <figure className={['overflow-hidden bg-clay ring-1 ring-white/10', className].join(' ')}>{image}</figure>
  )
}
