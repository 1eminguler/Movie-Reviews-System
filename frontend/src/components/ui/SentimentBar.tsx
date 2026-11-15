import type { SentimentSummary } from '../../types.ts'

interface SentimentBarProps {
  summary?: SentimentSummary
  totalReviews?: number
  className?: string
  compact?: boolean
}

export default function SentimentBar({
  summary,
  totalReviews,
  className = '',
  compact = false,
}: SentimentBarProps) {
  if (!summary) {
    return null
  }

  const { positive, neutral, negative, pending } = summary
  const scoredTotal = positive + neutral + negative
  const allTotal = scoredTotal + pending
  const denominator = totalReviews ?? allTotal

  if (allTotal === 0 || scoredTotal === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div
          className="h-2 w-full rounded-full border border-line bg-night"
          aria-hidden="true"
        />
        <p className="text-[13px] text-mute">
          {pending > 0
            ? `Sentiment analysis pending for ${pending} ${pending === 1 ? 'review' : 'reviews'}`
            : 'No reviews analysed yet'}
        </p>
      </div>
    )
  }

  const posPct = Math.round((positive / scoredTotal) * 100)
  const neuPct = Math.round((neutral / scoredTotal) * 100)
  const negPct = Math.max(0, 100 - posPct - neuPct)

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Yatay duygu şeridi */}
      <div
        className="h-2 w-full overflow-hidden rounded-full border border-line bg-night flex"
        role="progressbar"
        aria-label={`Sentiment distribution: ${posPct}% positive, ${neuPct}% neutral, ${negPct}% negative`}
      >
        <div className="flex h-full w-full animate-sentiment-fill">
          {positive > 0 && (
            <div
              style={{ width: `${posPct}%` }}
              className="h-full bg-pos"
              title={`Positive: ${positive}`}
            />
          )}
          {neutral > 0 && (
            <div
              style={{ width: `${neuPct}%` }}
              className="h-full bg-neu"
              title={`Neutral: ${neutral}`}
            />
          )}
          {negative > 0 && (
            <div
              style={{ width: `${negPct}%` }}
              className="h-full bg-neg"
              title={`Negative: ${negative}`}
            />
          )}
        </div>
      </div>

      {/* Sayılar ve özet */}
      {!compact && (
        <div className="space-y-2 text-[13px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-mute">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-pos"
                aria-hidden="true"
              />
              <span>Positive</span>
              <span className="tabular-nums font-medium text-ink">
                {positive}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-neu"
                aria-hidden="true"
              />
              <span>Neutral</span>
              <span className="tabular-nums font-medium text-ink">
                {neutral}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-neg"
                aria-hidden="true"
              />
              <span>Negative</span>
              <span className="tabular-nums font-medium text-ink">
                {negative}
              </span>
            </span>
          </div>

          <p className="tabular-nums text-[13px] text-mute">
            {scoredTotal} of {denominator}{' '}
            {denominator === 1 ? 'review' : 'reviews'} analysed
          </p>
        </div>
      )}
    </div>
  )
}
