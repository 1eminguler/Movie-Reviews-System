import { Fragment, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReviewForm from '../components/reviews/ReviewForm.tsx'
import ReviewList from '../components/reviews/ReviewList.tsx'
import ErrorState from '../components/ui/ErrorState.tsx'
import Poster from '../components/ui/Poster.tsx'
import RatingStars from '../components/ui/RatingStars.tsx'
import SentimentBar from '../components/ui/SentimentBar.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { TMDB_IMAGE_BASE } from '../config.ts'
import { useAuth } from '../auth/useAuth.ts'
import { useMovie } from '../hooks/useMovies.ts'
import {
  useMovieReviews,
  useMyReview,
  useSentimentSummary,
} from '../hooks/useReviews.ts'
import type { Movie } from '../types.ts'

function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function MovieDetailContent({ movie }: { movie: Movie }) {
  const { isAuthenticated, user } = useAuth()
  const [reviewPage, setReviewPage] = useState(1)
  const [isEditingMyReview, setIsEditingMyReview] = useState(false)

  const sentimentQuery = useSentimentSummary(movie.id)
  const reviewsQuery = useMovieReviews(movie.id, {
    page: reviewPage,
    page_size: 10,
  })
  const breakdownQuery = useMovieReviews(movie.id, { page_size: 100 })
  const myReviewQuery = useMyReview(movie.id, isAuthenticated)

  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : null
  const formattedRuntime = formatRuntime(movie.runtime)
  const directorsText =
    movie.director_names.length > 0 ? movie.director_names.join(', ') : 'Unknown'

  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null

  const myReview = myReviewQuery.data

  // Puan dağılımı (5..1 yıldız sayıları)
  const ratingBreakdown = useMemo(() => {
    const items = breakdownQuery.data?.items ?? []
    const counts = [0, 0, 0, 0, 0]
    for (const r of items) {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1
      counts[idx] += 1
    }
    return {
      counts,
      total: items.length,
    }
  }, [breakdownQuery.data])

  return (
    <div>
      {/* Tam genişlikte film arka plan afişi, yalnızca alttan zemine erir */}
      {backdropUrl && (
        <div className="relative -mx-[clamp(16px,2.5vw,48px)] -mt-6 sm:-mt-8 mb-8 h-[min(56vh,calc(100vw*9/21))] overflow-hidden bg-panel">
          <img
            src={backdropUrl}
            alt={`${movie.title} backdrop`}
            className="h-full w-full object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night to-transparent"
            aria-hidden="true"
          />
        </div>
      )}

      {/* 3 sütun (>=1280px), 2 sütun (768-1279px), tek sütun (mobil) */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px] items-start">
        {/* Afiş (1. sütun, masaüstü ve tablette yapışkan) */}
        <div className="w-[220px] sm:w-[280px] md:col-start-1 md:row-start-1 md:row-span-3 xl:row-span-2 md:sticky md:top-20">
          <Poster
            path={movie.poster_path}
            title={movie.title}
            size="lg"
            viewTransitionName={`poster-${movie.id}`}
          />
        </div>

        {/* Ana bilgiler ve özet */}
        <div className="md:col-start-2 md:row-start-1 xl:col-start-2 xl:row-start-1 space-y-4">
          <div>
            <h1 className="font-display text-[30px] sm:text-[44px] font-bold tracking-[-0.02em] leading-tight text-ink">
              {movie.title}
              {releaseYear && (
                <span className="ml-3 font-normal text-mute">
                  ({releaseYear})
                </span>
              )}
            </h1>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="mt-1 text-[15px] text-mute">
                Original title: {movie.original_title}
              </p>
            )}
          </div>

          {/* Yaş sınırı, süre ve türler */}
          {(movie.certification ||
            formattedRuntime ||
            movie.genre_names.length > 0) && (
            <div className="flex flex-wrap items-center gap-y-1 text-[15px] text-mute">
              {[
                movie.certification ? (
                  <span key="cert">{movie.certification}</span>
                ) : null,
                formattedRuntime ? (
                  <span key="runtime">{formattedRuntime}</span>
                ) : null,
                ...movie.genre_names.map((genre, index) => (
                  <Link
                    key={movie.genre_ids[index] ?? genre}
                    to={`/movies?genre_id=${movie.genre_ids[index]}`}
                    className="text-ink underline-offset-2 hover:underline"
                  >
                    {genre}
                  </Link>
                )),
              ]
                .filter(Boolean)
                .map((item, idx) => (
                  <Fragment key={idx}>
                    {idx > 0 && <span aria-hidden="true" className="mr-1.5">,</span>}
                    {item}
                  </Fragment>
                ))}
            </div>
          )}

          {/* Yönetmen */}
          <p className="text-[15px] text-mute">
            Directed by <span className="text-ink">{directorsText}</span>
          </p>

          {/* Ortalama puan ve değerlendirme sayısı */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <RatingStars value={movie.avg_rating} size="md" />
            <span className="tabular-nums text-[22px] font-bold text-ink">
              {movie.avg_rating !== null ? movie.avg_rating.toFixed(2) : '—'}
            </span>
            <span className="text-[15px] text-mute">
              from {movie.review_count}{' '}
              {movie.review_count === 1 ? 'rating' : 'ratings'}
            </span>
          </div>

          {/* Özet */}
          {movie.overview && (
            <p className="max-w-[72ch] pt-2 text-[15px] leading-relaxed text-ink">
              {movie.overview}
            </p>
          )}
        </div>

        {/* Duygu özeti ve puan dağılımı (1280px+ sağ sütun, 768-1279px yorumların üstünde) */}
        <aside className="md:col-start-2 md:row-start-2 xl:col-start-3 xl:row-start-1 xl:row-span-2 xl:sticky xl:top-20 rounded-[10px] border border-line bg-panel p-5 space-y-6">
          <div className="space-y-3">
            <h2 className="font-display text-[17px] font-semibold text-ink">
              Audience sentiment
            </h2>
            {sentimentQuery.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" rounded="full" />
                <Skeleton variant="text" className="h-3 w-2/3" />
              </div>
            ) : (
              <SentimentBar
                summary={sentimentQuery.data}
                totalReviews={movie.review_count}
              />
            )}
          </div>

          <div className="border-t border-line pt-5 space-y-3">
            <h2 className="font-display text-[17px] font-semibold text-ink">
              Rating breakdown
            </h2>

            {breakdownQuery.isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={`skel-bar-${i}`} className="h-3 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown.counts[star - 1] ?? 0
                  const pct =
                    ratingBreakdown.total > 0
                      ? Math.round((count / ratingBreakdown.total) * 100)
                      : 0

                  return (
                    <div
                      key={star}
                      className="flex items-center gap-3 text-[13px]"
                    >
                      <span className="w-8 tabular-nums flex items-center gap-1 text-mute">
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

                      <span className="w-8 text-right tabular-nums text-mute">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Kullanıcının yorumu ve yorumlar listesi */}
        <div className="md:col-start-2 md:row-start-3 xl:col-start-2 xl:row-start-2 space-y-8 border-t border-line pt-6">
          <section className="space-y-4">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
              Your review
            </h2>

            {isAuthenticated && myReview && !isEditingMyReview ? (
              <div className="rounded-[10px] border border-line bg-panel p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <RatingStars value={myReview.rating} size="md" />
                    <span className="tabular-nums text-[15px] font-medium text-ink">
                      {myReview.rating} / 5
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingMyReview(true)}
                    className="cursor-pointer rounded-[8px] border border-line px-3 py-1 text-[13px] font-medium text-ink transition-colors hover:border-mute"
                  >
                    Edit review
                  </button>
                </div>

                {myReview.review_text && (
                  <p className="max-w-[72ch] text-[15px] leading-relaxed text-ink whitespace-pre-line">
                    {myReview.review_text}
                  </p>
                )}
              </div>
            ) : (
              <ReviewForm
                movieId={movie.id}
                existingReview={isEditingMyReview ? myReview : null}
                onSuccess={() => setIsEditingMyReview(false)}
                onCancel={
                  isEditingMyReview
                    ? () => setIsEditingMyReview(false)
                    : undefined
                }
              />
            )}
          </section>

          <section id="reviews" className="space-y-4 border-t border-line pt-6">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
              Reviews ({movie.review_count})
            </h2>

            <ReviewList
              reviews={reviewsQuery.data?.items}
              total={reviewsQuery.data?.total}
              page={reviewPage}
              pageSize={10}
              onPageChange={(p) => setReviewPage(p)}
              isLoading={reviewsQuery.isPending}
              currentUserId={user?.id}
              onEdit={() => setIsEditingMyReview(true)}
            />
          </section>
        </div>
      </div>
    </div>
  )
}

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const movieId = Number(id)
  const isValidId = Number.isInteger(movieId) && movieId > 0

  const movieQuery = useMovie(movieId)

  if (!isValidId) {
    return (
      <div className="py-12 space-y-4">
        <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
          Movie not found
        </h1>
        <p className="text-[15px] text-mute">
          The requested movie identifier is not valid.
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
    )
  }

  if (movieQuery.isError) {
    return (
      <div className="py-10 space-y-6">
        <ErrorState
          error={movieQuery.error}
          onRetry={() => movieQuery.refetch()}
          title="Could not load movie details"
        />
        <div>
          <Link
            to="/movies"
            className="inline-flex items-center rounded-[8px] border border-line px-4 py-2 text-[15px] font-medium text-ink transition-colors hover:border-mute"
          >
            Back to movies
          </Link>
        </div>
      </div>
    )
  }

  if (movieQuery.isPending) {
    return (
      <div className="space-y-8 py-4">
        <Skeleton className="h-[min(56vh,calc(100vw*9/21))] w-full" rounded="lg" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <Skeleton variant="poster" className="w-[220px] sm:w-[280px]" />
          <div className="space-y-4">
            <Skeleton variant="text" className="h-10 w-2/3" />
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" rounded="lg" />
        </div>
      </div>
    )
  }

  return <MovieDetailContent movie={movieQuery.data} />
}
