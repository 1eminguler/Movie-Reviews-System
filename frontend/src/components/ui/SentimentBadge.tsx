import type { SentimentLabel, SentimentStatus } from '../../types.ts'

interface SentimentBadgeProps {
  status: SentimentStatus
  label?: SentimentLabel | null
  score?: number | null
  className?: string
}

export default function SentimentBadge({
  status,
  label,
  score,
  className = '',
}: SentimentBadgeProps) {
  // Yorum metni yoksa gösterilmez
  if (status === 'skipped') {
    return null
  }

  if (status === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-line bg-panel px-2 py-0.5 text-[13px] text-mute ${className}`}
      >
        Analysis pending
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-line bg-panel px-2 py-0.5 text-[13px] text-mute ${className}`}
      >
        Analysis failed
      </span>
    )
  }

  if (!label) {
    return null
  }

  const scoreText = score ? `${Math.round(score * 100)}%` : ''

  if (label === 'positive') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-line bg-night px-2 py-0.5 text-[13px] font-medium text-pos ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-pos" aria-hidden="true" />
        <span>Positive</span>
        {scoreText && (
          <span className="tabular-nums text-mute">{scoreText}</span>
        )}
      </span>
    )
  }

  if (label === 'neutral') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-line bg-night px-2 py-0.5 text-[13px] font-medium text-neu ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-neu" aria-hidden="true" />
        <span>Neutral</span>
        {scoreText && (
          <span className="tabular-nums text-mute">{scoreText}</span>
        )}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border border-line bg-night px-2 py-0.5 text-[13px] font-medium text-neg ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-neg" aria-hidden="true" />
      <span>Negative</span>
      {scoreText && (
        <span className="tabular-nums text-mute">{scoreText}</span>
      )}
    </span>
  )
}
