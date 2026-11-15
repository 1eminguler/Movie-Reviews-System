import type { SentimentSummary } from '../../types.ts'

interface SentimentBarProps {
  summary?: SentimentSummary
  className?: string
  compact?: boolean
}

export default function SentimentBar({
  summary,
  className = '',
  compact = false,
}: SentimentBarProps) {
  if (!summary) {
    return null
  }

  const { positive, neutral, negative, pending } = summary
  const scoredTotal = positive + neutral + negative
  const allTotal = scoredTotal + pending

  // Hiç yorum yoksa veya tümü bekliyorsa şık kesik çizgili durum
  if (allTotal === 0 || scoredTotal === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-dashed border-charcoal-700 bg-charcoal-900/60">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-projector/10 to-transparent animate-pulse" />
        </div>
        <p className="text-xs text-charcoal-400 italic">
          {pending > 0
            ? `${pending} yorum için duygu analizi bekleniyor…`
            : 'Henüz duygu analizi yapılmış yorum bulunmuyor.'}
        </p>
      </div>
    )
  }

  const posPct = Math.round((positive / scoredTotal) * 100)
  const neuPct = Math.round((neutral / scoredTotal) * 100)
  const negPct = Math.max(0, 100 - posPct - neuPct)

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Çubuk */}
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-charcoal-900 border border-charcoal-800 flex"
        role="progressbar"
        aria-label={`Duygu dağılımı: %${posPct} olumlu, %${neuPct} nötr, %${negPct} olumsuz`}
      >
        <div className="flex h-full w-full animate-sentiment-fill">
          {positive > 0 && (
            <div
              style={{ width: `${posPct}%` }}
              className="h-full bg-sentiment-pos transition-all duration-500"
              title={`Olumlu: ${positive}`}
            />
          )}
          {neutral > 0 && (
            <div
              style={{ width: `${neuPct}%` }}
              className="h-full bg-sentiment-neu transition-all duration-500"
              title={`Nötr: ${neutral}`}
            />
          )}
          {negative > 0 && (
            <div
              style={{ width: `${negPct}%` }}
              className="h-full bg-sentiment-neg transition-all duration-500"
              title={`Olumsuz: ${negative}`}
            />
          )}
        </div>
      </div>

      {/* Etiketler ve sayılar */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-charcoal-300">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sentiment-pos" />
              <span>Olumlu</span>
              <strong className="tabular-nums font-semibold text-charcoal-100">
                %{posPct}
              </strong>
              <span className="text-charcoal-500">({positive})</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sentiment-neu" />
              <span>Nötr</span>
              <strong className="tabular-nums font-semibold text-charcoal-100">
                %{neuPct}
              </strong>
              <span className="text-charcoal-500">({neutral})</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sentiment-neg" />
              <span>Olumsuz</span>
              <strong className="tabular-nums font-semibold text-charcoal-100">
                %{negPct}
              </strong>
              <span className="text-charcoal-500">({negative})</span>
            </span>
          </div>

          {pending > 0 && (
            <span className="text-[11px] text-amber-projector/80">
              {pending} analiz kuyrukta
            </span>
          )}
        </div>
      )}
    </div>
  )
}
