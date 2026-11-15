import Counter from '../components/bits/Counter.tsx'
import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/errors.ts'
import { useAuth } from '../auth/useAuth.ts'
import { FadeUp, RiseWords } from '../components/motion/Reveal.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import ErrorState from '../components/ui/ErrorState.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import Poster from '../components/ui/Poster.tsx'
import RatingStars from '../components/ui/RatingStars.tsx'
import SentimentBadge from '../components/ui/SentimentBadge.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { useMovie } from '../hooks/useMovies.ts'
import {
  useDeleteMyReview,
  useMyReviews,
  useUpdateMyReview,
} from '../hooks/useReviews.ts'
import type { Review } from '../types.ts'

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

function formatMonthYear(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

// Her yorum için ilgili filmin bilgisini yükleyen ve düzenleme/silme aksiyonlarını sunan satır bileşeni
function MyReviewRow({ review }: { review: Review }) {
  const { data: movie, isPending } = useMovie(review.movie_id)
  const updateMutation = useUpdateMyReview(review.movie_id)
  const deleteMutation = useDeleteMyReview(review.movie_id)

  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState<number>(review.rating)
  const [editText, setEditText] = useState<string>(review.review_text ?? '')
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setActionError(null)
    if (editRating < 1 || editRating > 5) {
      setActionError('Please select a rating between 1 and 5.')
      return
    }
    try {
      const cleanText = editText.trim() ? editText.trim() : null
      await updateMutation.mutateAsync({
        rating: editRating,
        review_text: cleanText,
      })
      setIsEditing(false)
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    setActionError(null)
    try {
      await deleteMutation.mutateAsync()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-6 border-b border-line py-6 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
      <Link
        to={`/movies/${review.movie_id}`}
        viewTransition
        className="block w-[72px] shrink-0 overflow-hidden rounded-xl"
      >
        {isPending ? (
          <Skeleton variant="poster" />
        ) : (
          <Poster
            path={movie?.poster_path ?? null}
            title={movie?.title ?? `Film #${review.movie_id}`}
            size="sm"
            className="rounded-xl"
          />
        )}
      </Link>

      <div className="min-w-0 space-y-2.5">
        <Link
          to={`/movies/${review.movie_id}`}
          viewTransition
          className="inline-block font-display text-[26px] leading-tight text-ink hover:underline"
        >
          {movie ? movie.title : `Film #${review.movie_id}`}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <RatingStars value={review.rating} size="sm" />
          <SentimentBadge
            status={review.sentiment_status}
            label={review.sentiment_label}
            score={review.sentiment_score}
          />
          <time className="text-[13px] text-mute">
            {formatDate(review.created_at)}
          </time>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-3 max-w-[70ch] space-y-4">
            <div>
              <span className="text-[13px] font-medium text-mute mb-2 block">
                Your rating
              </span>
              <RatingStars
                value={editRating}
                onChange={(val) => setEditRating(val)}
                size="md"
              />
            </div>

            <div>
              <label
                htmlFor={`edit-review-text-${review.id}`}
                className="text-[13px] font-medium text-mute mb-2 block"
              >
                Your review (optional)
              </label>
              <textarea
                id={`edit-review-text-${review.id}`}
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="field"
                placeholder="Share your thoughts on the film…"
              />
            </div>

            {actionError && (
              <p role="alert" className="text-[13px] text-neg">
                {actionError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn btn-primary btn-sm"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setActionError(null)
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {review.review_text && (
              <p className="max-w-[70ch] text-[16px] leading-relaxed text-ink whitespace-pre-line">
                {review.review_text}
              </p>
            )}

            {actionError && (
              <p role="alert" className="text-[13px] text-neg">
                {actionError}
              </p>
            )}
          </>
        )}
      </div>

      <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:self-start">
        <button
          type="button"
          onClick={() => {
            setEditRating(review.rating)
            setEditText(review.review_text ?? '')
            setActionError(null)
            setIsEditing((prev) => !prev)
          }}
          className="btn btn-ghost btn-sm"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="btn btn-ghost btn-sm hover:text-neg"
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const myReviewsQuery = useMyReviews({ page, page_size: pageSize })
  const allReviewsQuery = useMyReviews({ page: 1, page_size: 100 })

  const stats = useMemo(() => {
    const items = allReviewsQuery.data?.items ?? []
    const total = allReviewsQuery.data?.total ?? 0

    if (items.length === 0) {
      return {
        total: 0,
        avgRating: 0,
        distribution: [0, 0, 0, 0, 0],
      }
    }

    const sum = items.reduce((acc, curr) => acc + curr.rating, 0)
    const avg = sum / items.length

    const dist = [0, 0, 0, 0, 0]
    for (const r of items) {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1
      dist[idx] = (dist[idx] || 0) + 1
    }

    return {
      total,
      avgRating: Number(avg.toFixed(2)),
      distribution: dist,
    }
  }, [allReviewsQuery.data])

  return (
    <div className="page-gutter pt-10 md:pt-16 space-y-14">
      {/* Kullanıcı bilgileri ve özet sayılar */}
      <section className="border-b border-line pb-10">
        <h1 className="font-display text-[clamp(56px,8vw,128px)] leading-[0.9] text-ink">
          <RiseWords text={user?.username ?? 'Profile'} />
        </h1>

        <FadeUp delay={0.4}>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-mute">
            {user?.created_at && (
              <p>Member since {formatMonthYear(user.created_at)}</p>
            )}
            {user?.email && <p>{user.email}</p>}
          </div>
        </FadeUp>

        <FadeUp delay={0.5}>
          <div className="mt-8 flex flex-wrap items-start gap-12">
            <div>
              <span className="block font-display text-[48px] leading-none tabular-nums text-ink">
                <Counter value={stats.total} fontSize="1em" />
              </span>
              <span className="mt-2 block text-[13px] text-mute">
                Total reviews
              </span>
            </div>

            <div>
              <span className="block font-display text-[48px] leading-none tabular-nums text-ink">
                {stats.total > 0 ? <Counter value={stats.avgRating} decimals={1} fontSize="1em" /> : '—'}
              </span>
              <span className="mt-2 block text-[13px] text-mute">
                Average rating
              </span>
            </div>

            <div>
              <span className="block font-display text-[48px] leading-none tabular-nums text-ink">
                <Counter value={stats.distribution[4] ?? 0} fontSize="1em" />
              </span>
              <span className="mt-2 block text-[13px] text-mute">
                Five-star ratings
              </span>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Kullanıcının yorumları */}
      <section className="space-y-4">
        <h2 className="font-display text-[40px] leading-tight text-ink">
          Your <em>reviews</em>
        </h2>

        {myReviewsQuery.isError ? (
          <ErrorState
            error={myReviewsQuery.error}
            onRetry={() => myReviewsQuery.refetch()}
            title="Could not load your reviews"
          />
        ) : myReviewsQuery.isPending ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skel-my-rev-${i}`}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-6 py-6"
              >
                <Skeleton variant="poster" className="w-[72px]" />
                <div className="space-y-3">
                  <Skeleton variant="text" className="h-6 w-1/3" />
                  <Skeleton variant="text" className="h-4 w-1/4" />
                  <Skeleton variant="text" className="h-12 w-full max-w-[70ch]" />
                </div>
              </div>
            ))}
          </div>
        ) : myReviewsQuery.data?.items.length === 0 ? (
          <EmptyState
            title="You haven't reviewed any films yet"
            description="Rate and review films you've watched to see them listed here."
            action={
              <Link to="/movies" className="btn btn-primary">
                Browse movies
              </Link>
            }
          />
        ) : (
          <div>
            <div>
              {myReviewsQuery.data?.items.map((review) => (
                <MyReviewRow key={review.id} review={review} />
              ))}
            </div>

            <Pagination
              page={page}
              total={myReviewsQuery.data?.total ?? 0}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              className="pt-8"
            />
          </div>
        )}
      </section>
    </div>
  )
}
