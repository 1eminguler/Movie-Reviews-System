import { type FormEvent, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors.ts'
import { useAuth } from '../../auth/useAuth.ts'
import {
  useCreateReview,
  useDeleteMyReview,
  useUpdateMyReview,
} from '../../hooks/useReviews.ts'
import type { Review } from '../../types.ts'
import RatingStars from '../ui/RatingStars.tsx'

interface ReviewFormProps {
  movieId: number
  existingReview?: Review | null
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export default function ReviewForm({
  movieId,
  existingReview,
  onSuccess,
  onCancel,
  className = '',
}: ReviewFormProps) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  const [rating, setRating] = useState<number>(existingReview?.rating ?? 0)
  const [reviewText, setReviewText] = useState<string>(
    existingReview?.review_text ?? '',
  )
  const [prevReview, setPrevReview] = useState(existingReview)

  if (existingReview !== prevReview) {
    setPrevReview(existingReview)
    setRating(existingReview?.rating ?? 0)
    setReviewText(existingReview?.review_text ?? '')
  }

  const [formError, setFormError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const createMutation = useCreateReview(movieId)
  const updateMutation = useUpdateMyReview(movieId)
  const deleteMutation = useDeleteMyReview(movieId)

  if (!isAuthenticated) {
    return (
      <div
        className={`rounded-2xl bg-panel p-7 ${className}`}
      >
        <p className="text-[15px] text-ink">
          Sign in to rate and review this film.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="btn btn-primary"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            state={{ from: location.pathname }}
            className="btn btn-ghost"
          >
            Create account
          </Link>
        </div>
      </div>
    )
  }

  const isEditing = Boolean(existingReview)
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (rating < 1 || rating > 5) {
      setFormError('Please select a rating between 1 and 5.')
      return
    }

    try {
      const cleanText = reviewText.trim() ? reviewText.trim() : null
      if (isEditing) {
        await updateMutation.mutateAsync({
          rating,
          review_text: cleanText,
        })
      } else {
        await createMutation.mutateAsync({
          rating,
          review_text: cleanText,
        })
      }
      onSuccess?.()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    setFormError(null)
    try {
      await deleteMutation.mutateAsync()
      setShowDeleteConfirm(false)
      setRating(0)
      setReviewText('')
      onSuccess?.()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl bg-panel p-7 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-[26px] leading-none text-ink">
          {isEditing ? 'Edit your review' : 'Write a review'}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer text-[13px] text-mute hover:text-ink"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Puan seçimi */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-[13px] font-medium text-mute">Your rating</span>
        <div className="flex items-center gap-2.5">
          <RatingStars
            value={rating}
            onChange={(val) => setRating(val)}
            size="lg"
          />
          {rating > 0 ? (
            <span className="tabular-nums text-[13px] font-medium text-ink">
              {rating} / 5
            </span>
          ) : (
            <span className="text-[13px] text-mute">Select 1 to 5 stars</span>
          )}
        </div>
      </div>

      {/* Yorum metni */}
      <div className="mt-4">
        <label
          htmlFor="review-text-input"
          className="block text-[13px] font-medium text-mute"
        >
          Your review (optional)
        </label>
        <textarea
          id="review-text-input"
          rows={3}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts on the film…"
          className="field mt-2 bg-night!"
        />
      </div>

      {formError && (
        <p role="alert" className="mt-2 text-[13px] text-neg">
          {formError}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="btn btn-primary"
          >
            {isSubmitting
              ? 'Saving…'
              : isEditing
                ? 'Save changes'
                : 'Post review'}
          </button>

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          )}
        </div>

        {isEditing && (
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-mute">
                  Delete this review?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-sm bg-neg text-night"
                >
                  {isDeleting ? 'Deleting…' : 'Confirm delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="cursor-pointer text-[13px] text-mute transition-colors hover:text-neg"
              >
                Delete review
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
