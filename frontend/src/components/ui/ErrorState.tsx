import { getErrorMessage } from '../../api/errors.ts'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
  className?: string
}

export default function ErrorState({
  error,
  onRetry,
  title = 'Bir sorun oluştu',
  className = '',
}: ErrorStateProps) {
  const message = getErrorMessage(error)

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-lg border border-sentiment-neg-border bg-charcoal-900/60 p-8 text-center ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-sentiment-neg-border bg-sentiment-neg-bg text-sentiment-neg">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="font-serif text-lg font-normal text-charcoal-100">
        {title}
      </h3>

      <p className="mt-1.5 max-w-md text-sm text-charcoal-300">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-pressable mt-5 inline-flex items-center gap-2 rounded-md border border-charcoal-700 bg-charcoal-800 px-4 py-2 text-sm font-medium text-charcoal-100 hover:border-amber-projector/50 hover:bg-charcoal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector"
        >
          Tekrar Dene
        </button>
      )}
    </div>
  )
}
