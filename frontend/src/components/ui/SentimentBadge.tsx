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
        className={`inline-flex items-center gap-1.5 rounded-full border border-charcoal-700 bg-charcoal-850 px-2 py-0.5 text-xs text-charcoal-300 ${className}`}
        title="Duygu analizi işleniyor"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-projector animate-pulse" />
        Analiz bekleniyor
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-charcoal-800 bg-charcoal-900 px-2 py-0.5 text-xs text-charcoal-400 ${className}`}
      >
        Analiz edilemedi
      </span>
    )
  }

  // status === 'done'
  if (!label) {
    return null
  }

  const scoreText = score ? ` (%${Math.round(score * 100)})` : ''

  if (label === 'positive') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-sentiment-pos-border bg-sentiment-pos-bg px-2 py-0.5 text-xs font-medium text-sentiment-pos ${className}`}
        title={`Olumlu duygu${scoreText}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sentiment-pos" />
        Olumlu
        {score ? <span className="tabular-nums text-[10px] opacity-75">{scoreText}</span> : null}
      </span>
    )
  }

  if (label === 'neutral') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-sentiment-neu-border bg-sentiment-neu-bg px-2 py-0.5 text-xs font-medium text-sentiment-neu ${className}`}
        title={`Nötr duygu${scoreText}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sentiment-neu" />
        Nötr
        {score ? <span className="tabular-nums text-[10px] opacity-75">{scoreText}</span> : null}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-sentiment-neg-border bg-sentiment-neg-bg px-2 py-0.5 text-xs font-medium text-sentiment-neg ${className}`}
      title={`Olumsuz duygu${scoreText}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-sentiment-neg" />
      Olumsuz
      {score ? <span className="tabular-nums text-[10px] opacity-75">{scoreText}</span> : null}
    </span>
  )
}
