interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageNumbers(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }

  if (current >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages]
}

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (totalPages <= 1) {
    return null
  }

  const pages = getPageNumbers(page, totalPages)

  return (
    <nav
      role="navigation"
      aria-label="Sayfalama"
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="btn-pressable inline-flex h-9 items-center gap-1 rounded-md border border-charcoal-700 bg-charcoal-850 px-3 text-xs font-medium text-charcoal-200 hover:border-amber-projector/40 hover:bg-charcoal-800 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Önceki sayfa"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        <span>Önceki</span>
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-9 w-8 items-center justify-center text-xs text-charcoal-500"
                aria-hidden="true"
              >
                …
              </span>
            )
          }

          const isCurrent = p === page
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`btn-pressable inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-xs font-medium tabular-nums ${
                isCurrent
                  ? 'border-amber-projector bg-amber-projector text-charcoal-950 font-semibold'
                  : 'border-charcoal-800 bg-charcoal-900 text-charcoal-300 hover:border-charcoal-700 hover:text-charcoal-100'
              }`}
            >
              {p}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="btn-pressable inline-flex h-9 items-center gap-1 rounded-md border border-charcoal-700 bg-charcoal-850 px-3 text-xs font-medium text-charcoal-200 hover:border-amber-projector/40 hover:bg-charcoal-800 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Sonraki sayfa"
      >
        <span>Sonraki</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </nav>
  )
}
