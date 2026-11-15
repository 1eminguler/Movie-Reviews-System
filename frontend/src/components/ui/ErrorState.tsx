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
  title = 'Something went wrong',
  className = '',
}: ErrorStateProps) {
  const message = getErrorMessage(error)

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-[10px] border border-neg/40 bg-panel p-8 text-center ${className}`}
    >
      <h3 className="font-display text-[17px] font-semibold text-ink">
        {title}
      </h3>

      <p className="mt-2 max-w-[72ch] text-[15px] text-neg">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex cursor-pointer items-center rounded-[8px] border border-line bg-transparent px-4 py-2 text-[15px] font-medium text-ink transition-colors hover:border-mute"
        >
          Try again
        </button>
      )}
    </div>
  )
}
