interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  variant?: 'text' | 'rect' | 'poster'
}

const ROUNDED_MAP = {
  sm: 'rounded-[6px]',
  md: 'rounded-[6px]',
  lg: 'rounded-[10px]',
  full: 'rounded-full',
}

export default function Skeleton({
  className = '',
  rounded = 'md',
  variant = 'rect',
}: SkeletonProps) {
  const baseClasses = 'bg-panel border border-line'

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
        className={`aspect-[2/3] w-full rounded-[6px] ${baseClasses} ${className}`}
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
