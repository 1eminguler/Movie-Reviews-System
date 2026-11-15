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
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[8px] border border-line bg-transparent px-3 text-[13px] font-medium text-ink transition-colors hover:border-mute disabled:pointer-events-none disabled:opacity-40"
        aria-label="Previous page"
      >
        <span>Previous</span>
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-9 w-8 items-center justify-center text-[13px] text-mute"
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
              className={`inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-[8px] border px-2 text-[13px] font-medium tabular-nums transition-colors ${
                isCurrent
                  ? 'border-ink bg-ink text-night font-semibold'
                  : 'border-line bg-transparent text-ink hover:border-mute'
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
        className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[8px] border border-line bg-transparent px-3 text-[13px] font-medium text-ink transition-colors hover:border-mute disabled:pointer-events-none disabled:opacity-40"
        aria-label="Next page"
      >
        <span>Next</span>
      </button>
    </nav>
  )
}
