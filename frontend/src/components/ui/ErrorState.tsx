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
    <div role="alert" className={`py-8 text-left ${className}`}>
      <h3 className="font-display text-[32px] leading-tight text-ink">
        {title}
      </h3>

      <p className="mt-2 max-w-[70ch] text-[16px] text-mute">{message}</p>

      {onRetry && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-ghost btn-sm"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
