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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const TEXT_TRUNCATE_LIMIT = 280

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

  const displayText =
    isLong && !isExpanded ? `${text.slice(0, TEXT_TRUNCATE_LIMIT)}…` : text

  return (
    <article
      className={`border-b border-line/70 py-7 first:pt-0 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="font-display text-[22px] leading-none text-ink">
            {review.username}
          </span>
          {isOwner && (
            <span className="rounded-[6px] border border-line px-1.5 py-0.5 text-[13px] text-ink">
              You
            </span>
          )}
          <time className="text-[13px] text-mute">
            {formatDate(review.created_at)}
            {isUpdated && <span className="ml-1">(edited)</span>}
          </time>
        </div>

        <div className="flex items-center gap-2.5">
          <RatingStars value={review.rating} size="sm" />
          <SentimentBadge
            status={review.sentiment_status}
            label={review.sentiment_label}
            score={review.sentiment_score}
          />
        </div>
      </div>

      {text ? (
        <div className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-ink/90">
          <p className="whitespace-pre-line">{displayText}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-1.5 cursor-pointer text-[13px] font-medium text-mute hover:text-ink underline-offset-2 hover:underline"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-mute">
          Rated without a written review
        </p>
      )}

      {isOwner && (onEdit || onDelete) && (
        <div className="mt-4 flex items-center justify-end gap-2 text-[13px]">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              disabled={isDeleting}
              className="btn btn-ghost btn-sm"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(review)}
              disabled={isDeleting}
              className="btn btn-ghost btn-sm text-neg"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
