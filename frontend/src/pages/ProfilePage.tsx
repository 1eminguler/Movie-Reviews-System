import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ui/ErrorState.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import Poster from '../components/ui/Poster.tsx'
import RatingStars from '../components/ui/RatingStars.tsx'
import SentimentBadge from '../components/ui/SentimentBadge.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { useAuth } from '../auth/useAuth.ts'
import { useMovie } from '../hooks/useMovies.ts'
import { useMyReviews } from '../hooks/useReviews.ts'
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

// Her yorum için ilgili filmin bilgisini yükleyen satır bileşeni
function MyReviewRow({ review }: { review: Review }) {
  const { data: movie, isPending } = useMovie(review.movie_id)

  return (
    <article className="flex flex-col sm:flex-row gap-4 rounded-[10px] border border-line bg-panel p-4">
      <Link
        to={`/movies/${review.movie_id}`}
        viewTransition
        className="w-16 sm:w-20 shrink-0 self-start rounded-[6px]"
      >
        {isPending ? (
          <Skeleton variant="poster" />
        ) : (
          <Poster
            path={movie?.poster_path ?? null}
            title={movie?.title ?? `Film #${review.movie_id}`}
            size="sm"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={`/movies/${review.movie_id}`}
            viewTransition
            className="font-display text-[17px] font-semibold text-ink hover:underline truncate"
          >
            {movie ? movie.title : `Film #${review.movie_id}`}
          </Link>

          <div className="flex items-center gap-2.5">
            <RatingStars value={review.rating} size="sm" />
            <SentimentBadge
              status={review.sentiment_status}
              label={review.sentiment_label}
              score={review.sentiment_score}
            />
          </div>
        </div>

        {review.review_text && (
          <p className="max-w-[72ch] text-[15px] text-ink line-clamp-3 leading-relaxed whitespace-pre-line">
            {review.review_text}
          </p>
        )}

        <div className="flex items-center justify-between text-[13px] text-mute pt-1">
          <time>{formatDate(review.created_at)}</time>
          <Link
            to={`/movies/${review.movie_id}`}
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            View film
          </Link>
        </div>
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
    <div className="space-y-8">
      {/* Kullanıcı bilgileri ve özet sayılar */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-[10px] border border-line bg-panel p-6">
        <div className="space-y-1">
          <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
            {user?.username}
          </h1>
          <p className="text-[15px] text-mute">{user?.email}</p>
          {user?.created_at && (
            <p className="text-[13px] text-mute">
              Member since {formatDate(user.created_at)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-8 border-t border-line pt-4 sm:border-t-0 sm:pt-0">
          <div>
            <span className="block tabular-nums font-display text-[30px] font-bold text-ink">
              {stats.total}
            </span>
            <span className="text-[13px] text-mute">Total reviews</span>
          </div>

          <div className="h-10 w-px bg-line" aria-hidden="true" />

          <div>
            <span className="block tabular-nums font-display text-[30px] font-bold text-butter">
              {stats.total > 0 ? stats.avgRating : '—'}
            </span>
            <span className="text-[13px] text-mute">Average rating</span>
          </div>
        </div>
      </section>

      {/* Puan dağılımı */}
      {stats.total > 0 && (
        <section className="rounded-[10px] border border-line bg-panel p-5 space-y-3">
          <h2 className="font-display text-[17px] font-semibold text-ink">
            Rating breakdown
          </h2>
          <div className="space-y-2 max-w-md">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star - 1] || 0
              const pct =
                stats.total > 0 ? Math.round((count / stats.total) * 100) : 0

              return (
                <div
                  key={star}
                  className="flex items-center gap-3 text-[13px] text-ink"
                >
                  <span className="w-10 tabular-nums flex items-center gap-1 text-mute">
                    <span>{star}</span>
                    <span className="text-butter" aria-hidden="true">
                      ★
                    </span>
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full border border-line bg-night">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-butter"
                    />
                  </div>

                  <span className="w-16 text-right tabular-nums text-mute">
                    {count} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Kullanıcının yorumları */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
          Your reviews ({myReviewsQuery.data?.total ?? 0})
        </h2>

        {myReviewsQuery.isError ? (
          <ErrorState
            error={myReviewsQuery.error}
            onRetry={() => myReviewsQuery.refetch()}
            title="Could not load your reviews"
          />
        ) : myReviewsQuery.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skel-my-rev-${i}`}
                className="flex gap-4 rounded-[10px] border border-line bg-panel p-4"
              >
                <Skeleton variant="poster" className="w-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="h-4 w-1/3" />
                  <Skeleton variant="text" className="h-3 w-1/4" />
                  <Skeleton variant="text" className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : myReviewsQuery.data?.items.length === 0 ? (
          <div className="rounded-[10px] border border-line bg-panel p-8 text-center space-y-4">
            <p className="text-[15px] text-mute">
              You haven&apos;t reviewed any films yet.
            </p>
            <div>
              <Link
                to="/movies"
                className="inline-flex items-center rounded-[8px] bg-ink px-4 py-2 text-[15px] font-medium text-night transition-opacity hover:opacity-90"
              >
                Browse movies
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {myReviewsQuery.data?.items.map((review) => (
              <MyReviewRow key={review.id} review={review} />
            ))}

            <Pagination
              page={page}
              total={myReviewsQuery.data?.total ?? 0}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              className="pt-4"
            />
          </div>
        )}
      </section>
    </div>
  )
}
