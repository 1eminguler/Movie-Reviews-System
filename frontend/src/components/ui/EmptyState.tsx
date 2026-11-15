import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-charcoal-800 bg-charcoal-900/50 p-10 text-center ${className}`}
    >
      {/* Sinema projektörü / makara geometrisi */}
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-charcoal-700 bg-charcoal-850">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          className="h-8 w-8 text-amber-projector/80"
          aria-hidden="true"
        >
          {/* Film şeridi makarası */}
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="6.5" r="1.25" fill="currentColor" />
          <circle cx="12" cy="17.5" r="1.25" fill="currentColor" />
          <circle cx="6.5" cy="12" r="1.25" fill="currentColor" />
          <circle cx="17.5" cy="12" r="1.25" fill="currentColor" />
        </svg>
      </div>

      <h3 className="font-serif text-lg font-normal text-charcoal-100">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-charcoal-400">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
