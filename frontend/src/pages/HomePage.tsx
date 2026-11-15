import { useQueries } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { queryKeys } from '../api/queryKeys.ts'
import { getMovieReviews } from '../api/reviews.ts'
import MovieCard from '../components/movies/MovieCard.tsx'
import Poster from '../components/ui/Poster.tsx'
import RatingStars from '../components/ui/RatingStars.tsx'
import SentimentBadge from '../components/ui/SentimentBadge.tsx'
import SentimentBar from '../components/ui/SentimentBar.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { TMDB_IMAGE_BASE } from '../config.ts'
import { useGenres, useMovies } from '../hooks/useMovies.ts'
import { useMovieReviews, useSentimentSummary } from '../hooks/useReviews.ts'
import type { Movie, Review } from '../types.ts'

// ISO hafta numarasına göre deterministik tohum üretir
function getIsoWeekSeed(date: Date): number {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  )
  return target.getUTCFullYear() * 100 + weekNo
}

const CURRENT_WEEK_SEED = getIsoWeekSeed(new Date())

// Verilen tohumla deterministik dizi karıştırma
function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = items.slice()
  let state = seed >>> 0
  const nextRand = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}

function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function trimQuote(text: string, maxLength = 180): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  const sliced = cleaned.slice(0, maxLength)
  const lastSpace = sliced.lastIndexOf(' ')
  const cut = lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced
  return `${cut}…`
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  viewAllLink: string
}

function SectionHeader({ title, subtitle, viewAllLink }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <div>
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-mute">{subtitle}</p>}
      </div>

      <Link
        to={viewAllLink}
        className="shrink-0 text-[15px] text-mute transition-colors hover:text-ink"
      >
        See all
      </Link>
    </div>
  )
}

interface TwoRowPosterSectionProps {
  title: string
  subtitle?: string
  movies?: Movie[]
  isLoading?: boolean
  viewAllLink: string
}

function TwoRowPosterSection({
  title,
  subtitle,
  movies,
  isLoading = false,
  viewAllLink,
}: TwoRowPosterSectionProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [colCount, setColCount] = useState(6)

  // Ekran genişliğine göre tam 2 satır sığacak kart sayısını hesapla
  useEffect(() => {
    const el = gridRef.current
    if (!el) return

    const updateCols = () => {
      const cols = Math.max(1, Math.floor((el.clientWidth + 16) / (150 + 16)))
      setColCount(cols)
    }

    updateCols()
    const observer = new ResizeObserver(updateCols)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const visibleCount = colCount * 2
  const visibleMovies = movies ? movies.slice(0, visibleCount) : []

  return (
    <section className="space-y-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        viewAllLink={viewAllLink}
      />

      <div
        ref={gridRef}
        className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4"
      >
        {isLoading
          ? Array.from({ length: visibleCount }).map((_, idx) => (
              <div key={`skel-${idx}`} className="flex flex-col space-y-2">
                <Skeleton variant="poster" />
                <Skeleton variant="text" className="h-4 w-4/5" />
                <Skeleton variant="text" className="h-3 w-1/2" />
              </div>
            ))
          : visibleMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
      </div>
    </section>
  )
}

function FeaturedPick({ movie }: { movie: Movie }) {
  const sentimentQuery = useSentimentSummary(movie.id)
  const reviewsQuery = useMovieReviews(movie.id, { page_size: 3 })

  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : null
  const runtimeText = formatRuntime(movie.runtime)
  const metaLine = [
    movie.director_names.join(', '),
    movie.genre_names.slice(0, 2).join(', '),
    runtimeText,
  ]
    .filter(Boolean)
    .join(', ')

  const quoteReview = reviewsQuery.data?.items.find((r) =>
    Boolean(r.review_text?.trim()),
  )
  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null

  return (
    <div className="space-y-3">
      <Link to={`/movies/${movie.id}`} viewTransition className="block">
        <div className="aspect-video w-full overflow-hidden rounded-[6px] border border-line bg-panel">
          {backdropUrl && (
            <img
              src={backdropUrl}
              alt={`${movie.title} backdrop`}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </Link>

      <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
        <Link
          to={`/movies/${movie.id}`}
          viewTransition
          className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink hover:underline"
        >
          {movie.title}
          {releaseYear && (
            <span className="ml-2 font-normal text-mute">({releaseYear})</span>
          )}
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <RatingStars value={movie.avg_rating} size="sm" showValue />
          <span className="tabular-nums text-[13px] text-mute">
            ({movie.review_count})
          </span>
        </div>
      </div>

      {metaLine && <p className="text-[15px] text-mute">{metaLine}</p>}

      {sentimentQuery.data && (
        <SentimentBar summary={sentimentQuery.data} compact />
      )}

      {quoteReview?.review_text && (
        <blockquote className="max-w-[72ch] border-l-2 border-line pl-3 text-[15px] leading-relaxed text-ink">
          <p className="italic">“{trimQuote(quoteReview.review_text)}”</p>
          <footer className="mt-1 text-[13px] text-mute">
            {quoteReview.username}
          </footer>
        </blockquote>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          to={`/movies/${movie.id}`}
          viewTransition
          className="inline-flex items-center rounded-[8px] bg-ink px-4 py-2 text-[15px] font-medium text-night transition-opacity hover:opacity-90"
        >
          View film
        </Link>
        <Link
          to={`/movies/${movie.id}#reviews`}
          className="inline-flex items-center rounded-[8px] border border-line bg-transparent px-4 py-2 text-[15px] font-medium text-ink transition-colors hover:border-mute"
        >
          Read reviews
        </Link>
      </div>
    </div>
  )
}

interface RecentReviewWithMovie {
  review: Review
  movie: Movie
}

function RecentReviewsSection({ topMovies }: { topMovies: Movie[] }) {
  const reviewQueries = useQueries({
    queries: topMovies.map((movie) => ({
      queryKey: queryKeys.reviews.movie(movie.id, { page_size: 4 }),
      queryFn: () => getMovieReviews(movie.id, { page_size: 4 }),
      staleTime: 60_000,
    })),
  })

  const isLoading =
    topMovies.length === 0 || reviewQueries.some((q) => q.isPending)

  const recentReviews = useMemo<RecentReviewWithMovie[]>(() => {
    const collected: RecentReviewWithMovie[] = []
    topMovies.forEach((movie, index) => {
      const items = reviewQueries[index]?.data?.items ?? []
      for (const review of items) {
        if (review.review_text?.trim()) {
          collected.push({ review, movie })
        }
      }
    })
    return collected
      .sort((a, b) => b.review.created_at.localeCompare(a.review.created_at))
      .slice(0, 6)
  }, [topMovies, reviewQueries])

  return (
    <section className="space-y-4">
      <SectionHeader
        title="What people are saying"
        viewAllLink="/movies?sort=review_count&order=desc"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skel-quote-${idx}`}
              className="rounded-[10px] border border-line bg-panel p-4 flex gap-3.5"
            >
              <Skeleton variant="poster" className="w-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="h-4 w-3/4" />
                <Skeleton variant="text" className="h-3 w-1/3" />
                <Skeleton variant="text" className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : recentReviews.length === 0 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentReviews.map(({ review, movie }) => (
            <article
              key={review.id}
              className="rounded-[10px] border border-line bg-panel p-4 flex items-start gap-3.5"
            >
              <Link
                to={`/movies/${movie.id}`}
                viewTransition
                className="w-16 shrink-0 block rounded-[6px]"
              >
                <Poster
                  path={movie.poster_path}
                  title={movie.title}
                  size="sm"
                />
              </Link>

              <div className="min-w-0 flex-1 space-y-1.5">
                <Link
                  to={`/movies/${movie.id}`}
                  viewTransition
                  className="block truncate font-display text-[15px] font-semibold text-ink hover:underline"
                >
                  {movie.title}
                </Link>

                <p className="truncate text-[13px] text-mute">
                  {review.username}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <RatingStars value={review.rating} size="sm" />
                  <SentimentBadge
                    status={review.sentiment_status}
                    label={review.sentiment_label}
                  />
                </div>

                <p className="line-clamp-4 max-w-[72ch] text-[15px] leading-relaxed text-ink pt-1">
                  {review.review_text}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default function HomePage() {
  const poolQuery = useMovies({
    sort: 'review_count',
    order: 'desc',
    page_size: 60,
  })

  const mostDiscussedQuery = useMovies({
    sort: 'review_count',
    order: 'desc',
    page_size: 30,
  })

  const newReleasesQuery = useMovies({
    sort: 'release_date',
    order: 'desc',
    page_size: 30,
  })

  const genresQuery = useGenres()

  // Haftanın 7 seçkisi: en az 5 yorumu ve her iki görseli olan filmlerden haftalık deterministik seçim
  const { featuredPick, gridPicks } = useMemo(() => {
    const items = poolQuery.data?.items ?? []
    const eligible = items.filter(
      (m) =>
        m.review_count >= 5 &&
        Boolean(m.backdrop_path) &&
        Boolean(m.poster_path),
    )
    const shuffled = seededShuffle(eligible, CURRENT_WEEK_SEED)
    if (shuffled.length < 7) {
      const used = new Set(shuffled.map((m) => m.id))
      for (const fallback of items) {
        if (!used.has(fallback.id) && shuffled.length < 7) {
          shuffled.push(fallback)
          used.add(fallback.id)
        }
      }
    }
    return {
      featuredPick: shuffled[0] ?? null,
      gridPicks: shuffled.slice(1, 7),
    }
  }, [poolQuery.data])

  // En yüksek puanlılar: aynı 60 filmlik havuzdan >= 5 yorumlu olanlar puana göre sıralı
  const highestRatedMovies = useMemo(() => {
    const items = poolQuery.data?.items
    if (!items) return undefined
    return items
      .filter((m) => m.review_count >= 5)
      .slice()
      .sort(
        (a, b) =>
          (b.avg_rating ?? 0) - (a.avg_rating ?? 0) ||
          b.review_count - a.review_count,
      )
      .slice(0, 30)
  }, [poolQuery.data])

  const topThreeMostDiscussed = useMemo(
    () => (mostDiscussedQuery.data?.items ?? []).slice(0, 3),
    [mostDiscussedQuery.data],
  )

  return (
    <div className="space-y-12">
      {/* Haftanın seçkileri */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
          <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
            This week&apos;s picks
          </h1>
          <span className="text-[13px] text-mute">Changes every Monday</span>
        </div>

        {poolQuery.isPending ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-3">
              <Skeleton className="aspect-video w-full" />
              <Skeleton variant="text" className="h-6 w-2/3" />
              <Skeleton variant="text" className="h-4 w-1/2" />
              <Skeleton variant="text" className="h-16 w-full" />
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`skel-pick-${idx}`} className="space-y-2">
                  <Skeleton variant="poster" />
                  <Skeleton variant="text" className="h-4 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        ) : featuredPick ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <FeaturedPick movie={featuredPick} />
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {gridPicks.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* En çok tartışılanlar */}
      <TwoRowPosterSection
        title="Most discussed"
        movies={mostDiscussedQuery.data?.items}
        isLoading={mostDiscussedQuery.isPending}
        viewAllLink="/movies?sort=review_count&order=desc"
      />

      {/* En yüksek puanlılar */}
      <TwoRowPosterSection
        title="Highest rated"
        subtitle="Films with at least 5 reviews"
        movies={highestRatedMovies}
        isLoading={poolQuery.isPending}
        viewAllLink="/movies?sort=avg_rating&order=desc"
      />

      {/* Türe göre göz at */}
      <section className="space-y-4">
        <SectionHeader title="Browse by genre" viewAllLink="/movies" />
        <div className="flex flex-wrap gap-2">
          {(genresQuery.data ?? []).map((genre) => (
            <Link
              key={genre.id}
              to={`/movies?genre_id=${genre.id}`}
              className="rounded-[8px] border border-line bg-panel px-3.5 py-2 text-[15px] text-ink transition-colors hover:border-mute"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Son yorumlar */}
      <RecentReviewsSection topMovies={topThreeMostDiscussed} />

      {/* Yeni çıkanlar */}
      <TwoRowPosterSection
        title="New releases"
        movies={newReleasesQuery.data?.items}
        isLoading={newReleasesQuery.isPending}
        viewAllLink="/movies?sort=release_date&order=desc"
      />
    </div>
  )
}
