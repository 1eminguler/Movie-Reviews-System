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
    <div className={`py-8 text-left ${className}`}>
      <h3 className="font-display text-[32px] leading-tight text-ink">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-[70ch] text-[16px] text-mute">{description}</p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
