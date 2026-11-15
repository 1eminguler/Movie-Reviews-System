interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageNumbers(
  current: number,
  totalPages: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }

  if (current >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    'ellipsis',
    current - 1,
    current,
    current + 1,
    'ellipsis',
    totalPages,
  ]
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
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="btn btn-ghost btn-sm"
        aria-label="Previous page"
      >
        <span aria-hidden="true">←</span>
        <span>Previous</span>
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-11 min-w-11 items-center justify-center text-[14px] text-mute"
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
              className={`inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full px-3 text-[14px] font-medium tabular-nums transition-colors ${
                isCurrent
                  ? 'bg-ink text-night'
                  : 'text-mute hover:bg-panel hover:text-ink'
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
        className="btn btn-ghost btn-sm"
        aria-label="Next page"
      >
        <span>Next</span>
        <span className="arrow" aria-hidden="true">
          →
        </span>
      </button>
    </nav>
  )
}
