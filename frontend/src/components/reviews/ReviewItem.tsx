import { useState } from 'react'
import type { Review } from '../../types.ts'
import RatingStars from '../ui/RatingStars.tsx'
import SentimentBadge from '../ui/SentimentBadge.tsx'

interface ReviewItemProps {
  review: Review
  currentUserId?: number | null
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
  isDeleting?: boolean
  className?: string
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return iso
  }
}

const TEXT_TRUNCATE_LIMIT = 260

export default function ReviewItem({
  review,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting = false,
  className = '',
}: ReviewItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isOwner = Boolean(currentUserId && currentUserId === review.user_id)
  const isUpdated = review.updated_at && review.updated_at !== review.created_at
  const text = review.review_text ?? ''
  const isLong = text.length > TEXT_TRUNCATE_LIMIT

  const displayText = isLong && !isExpanded
    ? `${text.slice(0, TEXT_TRUNCATE_LIMIT)}…`
    : text

  const initial = (review.username[0] ?? '?').toUpperCase()

  return (
    <article
      className={`rounded-lg border border-charcoal-800 bg-charcoal-900/40 p-4 transition-colors hover:border-charcoal-700 ${className}`}
    >
      {/* Üst bilgi satırı */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Avatar monogramı */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-charcoal-700 bg-charcoal-850 font-serif text-sm font-semibold text-amber-projector">
            {initial}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-charcoal-100">
                {review.username}
              </span>
              {isOwner && (
                <span className="rounded bg-charcoal-800 px-1.5 py-0.2 text-[10px] font-semibold text-amber-projector border border-charcoal-700">
                  Siz
                </span>
              )}
            </div>
            <time className="text-[11px] text-charcoal-500">
              {formatDate(review.created_at)}
              {isUpdated && <span className="ml-1 italic">(düzenlendi)</span>}
            </time>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RatingStars value={review.rating} size="sm" />
          <SentimentBadge
            status={review.sentiment_status}
            label={review.sentiment_label}
            score={review.sentiment_score}
          />
        </div>
      </div>

      {/* Yorum metni */}
      {text ? (
        <div className="mt-3 text-sm leading-relaxed text-charcoal-200">
          <p className="whitespace-pre-line">{displayText}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-1.5 text-xs font-medium text-amber-projector hover:underline focus:outline-none"
            >
              {isExpanded ? 'Daha az göster' : 'Devamını oku'}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs italic text-charcoal-500">
          (Yalnızca puan verildi, metin yazılmadı)
        </p>
      )}

      {/* Kullanıcının kendi yorumu ise düzenleme / silme işlemleri */}
      {isOwner && (onEdit || onDelete) && (
        <div className="mt-3 pt-3 border-t border-charcoal-800/80 flex items-center justify-end gap-2 text-xs">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              disabled={isDeleting}
              className="btn-pressable inline-flex items-center gap-1 rounded px-2.5 py-1 text-charcoal-300 hover:bg-charcoal-800 hover:text-charcoal-100 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              <span>Düzenle</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(review)}
              disabled={isDeleting}
              className="btn-pressable inline-flex items-center gap-1 rounded px-2.5 py-1 text-sentiment-neg hover:bg-sentiment-neg-bg disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span>{isDeleting ? 'Siliniyor…' : 'Sil'}</span>
            </button>
          )}
        </div>
      )}
    </article>
  )
}
