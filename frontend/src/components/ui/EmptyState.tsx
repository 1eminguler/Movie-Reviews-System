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
      className={`flex flex-col items-center justify-center rounded-[10px] border border-line bg-panel p-8 text-center ${className}`}
    >
      <h3 className="font-display text-[17px] font-semibold text-ink">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-[72ch] text-[15px] text-mute">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
