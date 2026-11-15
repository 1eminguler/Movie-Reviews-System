interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  variant?: 'text' | 'rect' | 'poster'
}

const ROUNDED_MAP = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export default function Skeleton({
  className = '',
  rounded = 'md',
  variant = 'rect',
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-charcoal-850/80 border border-charcoal-800/40'

  if (variant === 'text') {
    return (
      <div
        className={`h-4 w-full ${ROUNDED_MAP[rounded]} ${baseClasses} ${className}`}
        aria-hidden="true"
      />
    )
  }

  if (variant === 'poster') {
    return (
      <div
        className={`aspect-[2/3] w-full ${ROUNDED_MAP[rounded]} ${baseClasses} ${className}`}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={`${ROUNDED_MAP[rounded]} ${baseClasses} ${className}`}
      aria-hidden="true"
    />
  )
}
