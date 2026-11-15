import { motion, useReducedMotion } from 'motion/react'
import { Fragment, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ClickSpark from '../components/bits/ClickSpark.tsx'
import Counter from '../components/bits/Counter.tsx'
import GlareHover from '../components/bits/GlareHover.tsx'
import Noise from '../components/bits/Noise.tsx'
import { FadeUp, RiseWords } from '../components/motion/Reveal.tsx'
import { EASE_ENTER } from '../lib/motion.ts'
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
import { formatRuntime, releaseYear } from '../lib/format.ts'
import type { Movie } from '../types.ts'

function MovieDetailContent({ movie }: { movie: Movie }) {
  const { isAuthenticated, user } = useAuth()
  const reduce = useReducedMotion()
  const [reviewPage, setReviewPage] = useState(1)
  const [isEditingMyReview, setIsEditingMyReview] = useState(false)

  const sentimentQuery = useSentimentSummary(movie.id)
  const reviewsQuery = useMovieReviews(movie.id, {
    page: reviewPage,
    page_size: 10,
  })
  const breakdownQuery = useMovieReviews(movie.id, { page_size: 100 })
  const myReviewQuery = useMyReview(movie.id, isAuthenticated)

  const year = releaseYear(movie)
  const formattedRuntime = formatRuntime(movie.runtime)
  const directorsText = movie.director_names.length > 0 ? movie.director_names.join(', ') : 'Unknown'
  const backdropUrl = movie.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}` : null
  const myReview = myReviewQuery.data

  // Puan dağılımı (5..1 yıldız sayıları)
  const ratingBreakdown = useMemo(() => {
    const items = breakdownQuery.data?.items ?? []
    const counts = [0, 0, 0, 0, 0]
    for (const r of items) {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1
      counts[idx] += 1
    }
    return { counts, total: items.length }
  }, [breakdownQuery.data])

  const meta = [
    year ? <span key="year">{year}</span> : null,
    movie.certification ? <span key="cert" className="rounded-md border border-white/25 px-1.5 text-[13px]">{movie.certification}</span> : null,
    formattedRuntime ? <span key="runtime">{formattedRuntime}</span> : null,
    ...movie.genre_names.map((genre, index) => (
      <Link key={movie.genre_ids[index] ?? genre} to={`/movies?genre_id=${movie.genre_ids[index]}`} className="text-ink underline decoration-white/30 underline-offset-4 hover:decoration-ink">
        {genre}
      </Link>
    )),
  ].filter(Boolean)

  return (
    <div>
      {/* Tam ekran sahne: film arka planı, üzerinde film greni; alt kenar zemine erir */}
      <section className="relative isolate flex min-h-[min(100svh,960px)] flex-col justify-end overflow-hidden" aria-labelledby="movie-title">
        <div className="absolute inset-0 -z-10 bg-night">
          {backdropUrl && (
            <motion.img
              src={backdropUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[50%_25%]"
              initial={reduce ? false : { scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.1, ease: EASE_ENTER }}
            />
          )}
          <Noise opacity={0.12} fps={reduce ? 0 : 18} blendMode="overlay" style={{ position: 'absolute', inset: 0 }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-night)_4%,rgb(10_10_13/0.8)_38%,rgb(10_10_13/0.15)_70%,rgb(10_10_13/0.55)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(10_10_13/0.75),transparent_65%)]" />
        </div>

        <div className="page-gutter grid grid-cols-1 items-end gap-8 pb-14 pt-48 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:pt-36 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
          <FadeUp className="w-[180px] md:w-full">
            <GlareHover background="transparent" borderRadius="14px" borderColor="transparent" glareOpacity={0.35} glareSize={220} width="100%" height="auto">
              <Poster path={movie.poster_path} title={movie.title} size="lg" viewTransitionName={`poster-${movie.id}`} />
            </GlareHover>
          </FadeUp>

          <div className="min-w-0">
            <FadeUp className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-mute">
              {meta.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-mute" aria-hidden="true" />}
                  {item}
                </Fragment>
              ))}
            </FadeUp>
            <h1 id="movie-title" className="font-display text-[clamp(48px,7.4vw,132px)] leading-[0.92]">
              <RiseWords text={movie.title} />
            </h1>
            {movie.original_title && movie.original_title !== movie.title && (
              <FadeUp delay={0.4} className="mt-3 text-[15px] text-mute">
                Original title: <span className="font-display italic text-ink/80">{movie.original_title}</span>
              </FadeUp>
            )}
            <FadeUp delay={0.45} className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-5">
              <div className="flex items-end gap-4">
                <span className="font-display text-[clamp(56px,6vw,88px)] leading-[0.8] text-ink">
                  {movie.avg_rating !== null ? <Counter value={movie.avg_rating} decimals={1} fontSize="1em" duration={1.2} /> : '–'}
                </span>
                <span className="space-y-1.5 pb-1">
                  <RatingStars value={movie.avg_rating} size="md" />
                  <span className="block text-[14px] text-mute">
                    from {movie.review_count} {movie.review_count === 1 ? 'rating' : 'ratings'}
                  </span>
                </span>
              </div>
              <p className="pb-1 text-[15px] text-mute">
                Directed by <span className="text-ink">{directorsText}</span>
              </p>
            </FadeUp>
            <FadeUp delay={0.52} className="mt-8 flex flex-wrap gap-3">
              <a href="#write" className="btn btn-primary">
                {myReview ? 'See your review' : 'Write a review'}
              </a>
              <a href="#reviews" className="btn btn-ghost">
                Read {movie.review_count} {movie.review_count === 1 ? 'review' : 'reviews'}
              </a>
            </FadeUp>
          </div>
        </div>
      </section>

      <div className="page-gutter grid grid-cols-1 gap-14 pt-6 lg:grid-cols-12">
        <div className="space-y-20 lg:col-span-7">
          {movie.overview && (
            <section aria-labelledby="story-title">
              <h2 id="story-title" className="font-display mb-5 text-[clamp(32px,3.4vw,48px)] leading-none">
                The <em>story</em>
              </h2>
              <p className="max-w-[62ch] text-[20px] leading-[1.6] text-ink/85">{movie.overview}</p>
            </section>
          )}

          <section id="write" className="scroll-mt-28" aria-labelledby="your-review-title">
            <h2 id="your-review-title" className="font-display mb-6 text-[clamp(32px,3.4vw,48px)] leading-none">
              Your <em>review</em>
            </h2>
            {isAuthenticated && myReview && !isEditingMyReview ? (
              <div className="rounded-2xl bg-panel p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <RatingStars value={myReview.rating} size="lg" />
                    <span className="font-display text-[28px] leading-none text-ink">{myReview.rating} / 5</span>
                  </div>
                  <button type="button" onClick={() => setIsEditingMyReview(true)} className="btn btn-ghost btn-sm">
                    Edit review
                  </button>
                </div>
                {myReview.review_text && (
                  <p className="mt-5 max-w-[66ch] whitespace-pre-line text-[17px] leading-relaxed text-ink/90">{myReview.review_text}</p>
                )}
              </div>
            ) : (
              <ClickSpark sparkColor={['#e63950', '#f4efe6']} sparkCount={10} sparkRadius={26} duration={500}>
                <ReviewForm
                  movieId={movie.id}
                  existingReview={isEditingMyReview ? myReview : null}
                  onSuccess={() => setIsEditingMyReview(false)}
                  onCancel={isEditingMyReview ? () => setIsEditingMyReview(false) : undefined}
                />
              </ClickSpark>
            )}
          </section>

          <section id="reviews" className="scroll-mt-28" aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="font-display mb-6 flex items-baseline gap-4 text-[clamp(32px,3.4vw,48px)] leading-none">
              <span>All <em>reviews</em></span>
              <span className="font-sans text-[17px] tabular-nums text-mute">{movie.review_count}</span>
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

        {/* Seyirci paneli: duygu dağılımı ve yıldız dağılımı */}
        <aside className="lg:col-span-5">
          <div className="space-y-10 rounded-2xl bg-panel p-8 lg:sticky lg:top-24">
            <div>
              <h2 className="font-display mb-5 text-[30px] leading-none">
                Audience <em>sentiment</em>
              </h2>
              {sentimentQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" rounded="full" />
                  <Skeleton variant="text" className="h-3 w-2/3" />
                </div>
              ) : (
                <SentimentBar summary={sentimentQuery.data} totalReviews={movie.review_count} />
              )}
            </div>

            <div>
              <h2 className="font-display mb-5 text-[30px] leading-none">
                Rating <em>breakdown</em>
              </h2>
              {breakdownQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star, i) => {
                    const count = ratingBreakdown.counts[star - 1] ?? 0
                    const pct = ratingBreakdown.total > 0 ? Math.round((count / ratingBreakdown.total) * 100) : 0
                    return (
                      <div key={star} className="flex items-center gap-4 text-[14px]">
                        <span className="flex w-9 items-center gap-1 tabular-nums text-mute">
                          {star} <span className="text-ink" aria-hidden="true">★</span>
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-night">
                          <div
                            style={{ width: `${pct}%`, animationDelay: `${i * 80}ms` }}
                            className="animate-sentiment-fill h-full rounded-full bg-accent"
                          />
                        </div>
                        <span className="w-9 text-right tabular-nums text-mute">{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
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
      <div className="page-gutter space-y-6 pb-16 pt-40">
        <h1 className="font-display text-[clamp(44px,6vw,88px)] leading-none text-ink">
          Movie not found
        </h1>
        <p className="text-[15px] text-mute">
          The requested movie identifier is not valid.
        </p>
        <div>
          <Link
            to="/movies"
            className="btn btn-light"
          >
            Browse movies
          </Link>
        </div>
      </div>
    )
  }

  if (movieQuery.isError) {
    return (
      <div className="page-gutter space-y-6 pb-16 pt-40">
        <ErrorState
          error={movieQuery.error}
          onRetry={() => movieQuery.refetch()}
          title="Could not load movie details"
        />
        <div>
          <Link
            to="/movies"
            className="btn btn-ghost"
          >
            Back to movies
          </Link>
        </div>
      </div>
    )
  }

  if (movieQuery.isPending) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[min(100svh,960px)] w-full" rounded="sm" />
        <div className="page-gutter grid grid-cols-1 gap-8 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
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
