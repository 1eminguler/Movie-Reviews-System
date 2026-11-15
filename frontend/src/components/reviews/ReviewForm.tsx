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

  // Gelen prop değişirse state'i güncelle (React önerilen desen)
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
        className={`rounded-lg border border-charcoal-800 bg-charcoal-900/60 p-6 text-center ${className}`}
      >
        <p className="text-sm text-charcoal-300">
          Bu filme puan vermek ve deneyiminizi paylaşmak için oturum açmalısınız.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="btn-pressable inline-flex items-center rounded-md bg-amber-projector px-4 py-2 text-xs font-semibold text-charcoal-950 hover:bg-amber-projector-hover"
          >
            Giriş Yap
          </Link>
          <Link
            to="/register"
            state={{ from: location.pathname }}
            className="btn-pressable inline-flex items-center rounded-md border border-charcoal-700 bg-charcoal-850 px-4 py-2 text-xs font-medium text-charcoal-200 hover:border-amber-projector/40"
          >
            Kayıt Ol
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
      setFormError('Lütfen 1 ile 5 arasında bir puan seçin.')
      return
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          rating,
          review_text: reviewText.trim() ? reviewText.trim() : null,
        })
      } else {
        await createMutation.mutateAsync({
          rating,
          review_text: reviewText.trim() ? reviewText.trim() : null,
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
      className={`rounded-lg border border-charcoal-800 bg-charcoal-900/60 p-5 backdrop-blur ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-base font-normal text-charcoal-100">
          {isEditing ? 'Yorumunuzu Güncelleyin' : 'Puan Verin ve Yorum Yazın'}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-charcoal-400 hover:text-charcoal-200"
          >
            Vazgeç
          </button>
        )}
      </div>

      {/* Puan seçimi */}
      <div className="mt-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-xs font-medium text-charcoal-300">
          Puanınız:
        </span>
        <div className="flex items-center gap-2">
          <RatingStars
            value={rating}
            onChange={(val) => setRating(val)}
            size="lg"
          />
          {rating > 0 ? (
            <span className="tabular-nums text-xs font-semibold text-amber-projector">
              {rating} / 5
            </span>
          ) : (
            <span className="text-xs text-charcoal-500">
              Yıldıza tıklayarak puan verin
            </span>
          )}
        </div>
      </div>

      {/* Yorum metni alanı */}
      <div className="mt-4">
        <label
          htmlFor="review-text-input"
          className="block text-xs font-medium text-charcoal-300"
        >
          Yorumunuz <span className="text-charcoal-500">(isteğe bağlı)</span>:
        </label>
        <textarea
          id="review-text-input"
          rows={3}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Bu film hakkında ne düşünüyorsunuz? Oyunculuklar, senaryo, atmosfer…"
          className="mt-1.5 w-full rounded-md border border-charcoal-700 bg-charcoal-950 p-3 text-sm text-charcoal-100 placeholder-charcoal-500 transition-colors focus:border-amber-projector focus:outline-none"
        />
      </div>

      {/* Hata bildirimi */}
      {formError && (
        <p className="mt-2 text-xs text-sentiment-neg">
          {formError}
        </p>
      )}

      {/* Butonlar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="btn-pressable inline-flex items-center rounded-md bg-amber-projector px-4 py-2 text-xs font-semibold text-charcoal-950 hover:bg-amber-projector-hover disabled:pointer-events-none disabled:opacity-40"
          >
            {isSubmitting
              ? 'Kaydediliyor…'
              : isEditing
                ? 'Değişiklikleri Kaydet'
                : 'Yorumu Gönder'}
          </button>

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-pressable inline-flex items-center rounded-md border border-charcoal-700 bg-charcoal-850 px-3.5 py-2 text-xs font-medium text-charcoal-300 hover:text-charcoal-100"
            >
              İptal
            </button>
          )}
        </div>

        {isEditing && (
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal-400">
                  Yorum silinsin mi?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn-pressable rounded bg-sentiment-neg px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isDeleting ? 'Siliniyor…' : 'Evet, Sil'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded border border-charcoal-700 px-2.5 py-1 text-xs text-charcoal-300 hover:text-white"
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-pressable text-xs text-charcoal-400 hover:text-sentiment-neg"
              >
                Yorumu Sil
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
