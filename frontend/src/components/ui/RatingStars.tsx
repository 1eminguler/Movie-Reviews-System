import { type KeyboardEvent, useState } from 'react'

interface RatingStarsProps {
  value: number | null
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const STAR_SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
  lg: 'w-6 h-6',
}

export default function RatingStars({
  value,
  onChange,
  max = 5,
  size = 'md',
  showValue = false,
  className = '',
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [bouncingStar, setBouncingStar] = useState<number | null>(null)

  const isInteractive = Boolean(onChange)
  const currentValue = hoverValue ?? value ?? 0

  const handleSelect = (val: number) => {
    if (!onChange) return
    setBouncingStar(val)
    onChange(val)
    setTimeout(() => {
      setBouncingStar((prev) => (prev === val ? null : prev))
    }, 250)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onChange) return
    const current = value ?? 0

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(max, current + 1)
      handleSelect(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const prev = Math.max(1, current - 1)
      handleSelect(prev)
    } else if (e.key >= '1' && e.key <= String(max)) {
      e.preventDefault()
      handleSelect(Number(e.key))
    }
  }

  return (
    <div
      className={`inline-flex items-center ${size === 'sm' ? 'gap-1' : 'gap-1.5'} ${className}`}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'radiogroup' : undefined}
      aria-label={
        isInteractive
          ? `Select rating (1 to ${max})`
          : `Rating: ${value ?? 0} out of ${max}`
      }
    >
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={isInteractive ? () => setHoverValue(null) : undefined}
      >
        {Array.from({ length: max }, (_, index) => {
          const starNumber = index + 1
          const fillRatio = Math.max(0, Math.min(1, currentValue - index))
          const isBouncing = bouncingStar === starNumber

          const starElement = (
            <span
              className={`relative inline-block transition-transform duration-150 ${STAR_SIZES[size]} ${
                isBouncing ? 'animate-star-bounce' : ''
              }`}
            >
              {/* Boş yıldız tabanı */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-full h-full text-line"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                />
              </svg>

              {/* Dolu yıldız katmanı */}
              {fillRatio > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillRatio * 100}%` }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-full h-full text-butter"
                    aria-hidden="true"
                  >
                    <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
                  </svg>
                </span>
              )}
            </span>
          )

          if (!isInteractive) {
            return <span key={starNumber}>{starElement}</span>
          }

          return (
            <button
              key={starNumber}
              type="button"
              role="radio"
              aria-checked={value === starNumber}
              aria-label={`${starNumber} ${starNumber === 1 ? 'star' : 'stars'}`}
              className="p-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded"
              onClick={() => handleSelect(starNumber)}
              onMouseEnter={() => setHoverValue(starNumber)}
            >
              {starElement}
            </button>
          )
        })}
      </div>

      {showValue && value !== null && (
        <span className="tabular-nums text-[13px] font-medium text-ink">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
