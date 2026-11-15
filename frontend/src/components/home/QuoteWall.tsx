import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { queryKeys } from '../../api/queryKeys.ts'
import { getMovieReviews } from '../../api/reviews.ts'
import { TMDB_IMAGE_BASE } from '../../config.ts'
import { trimQuote } from '../../lib/format.ts'
import type { Movie, Review } from '../../types.ts'
import { SectionHeading } from '../movies/PosterRail.tsx'
import RatingStars from '../ui/RatingStars.tsx'
import SentimentBadge from '../ui/SentimentBadge.tsx'
import Skeleton from '../ui/Skeleton.tsx'

interface Entry {
  review: Review
  movie: Movie
}

// Son yorumlar: biri büyük alıntı olarak, kalanlar onun yanında sütunlarda
export default function QuoteWall({ topMovies }: { topMovies: Movie[] }) {
  const queries = useQueries({
    queries: topMovies.map((movie) => ({
      queryKey: queryKeys.reviews.movie(movie.id, { page_size: 4 }),
      queryFn: () => getMovieReviews(movie.id, { page_size: 4 }),
      staleTime: 60_000,
    })),
  })
  const isLoading = topMovies.length === 0 || queries.some((q) => q.isPending)

  const entries = useMemo<Entry[]>(() => {
    const collected: Entry[] = []
    topMovies.forEach((movie, i) => {
      for (const review of queries[i]?.data?.items ?? []) {
        if (review.review_text?.trim()) collected.push({ review, movie })
      }
    })
    // Her filmden bir alıntı öne gelir, sonra en yeniler
    const seen = new Set<number>()
    const firsts = collected.filter((e) => (seen.has(e.movie.id) ? false : (seen.add(e.movie.id), true)))
    const rest = collected.filter((e) => !firsts.includes(e)).sort((a, b) => b.review.created_at.localeCompare(a.review.created_at))
    return [...firsts, ...rest].slice(0, 4)
  }, [topMovies, queries])

  const [lead, ...others] = entries

  return (
    <section className="page-gutter py-14" aria-labelledby="quotes-title">
      <SectionHeading id="quotes-title" title={<>What people are <em>saying</em></>} link={{ to: '/movies?sort=review_count&order=desc', label: 'Most reviewed' }} />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Skeleton className="h-[380px] lg:col-span-7" rounded="lg" />
          <div className="space-y-6 lg:col-span-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28" rounded="lg" />
            ))}
          </div>
        </div>
      ) : !lead ? null : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Link
            to={`/movies/${lead.movie.id}#reviews`}
            viewTransition
            className="group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-2xl p-8 sm:p-10 lg:col-span-7"
          >
            {lead.movie.backdrop_path && (
              <img
                src={`${TMDB_IMAGE_BASE}/w1280${lead.movie.backdrop_path}`}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[600ms] ease-[var(--ease-out)] group-hover:scale-[1.03]"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/80 to-night/20" />
            <span className="font-display absolute left-6 top-0 text-[180px] leading-none text-accent/90" aria-hidden="true">
              &ldquo;
            </span>
            <blockquote className="font-display text-[clamp(26px,2.8vw,42px)] italic leading-[1.2] text-ink">
              {trimQuote(lead.review.review_text!, 220)}
            </blockquote>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px]">
              <span className="text-ink">{lead.review.username}</span>
              <span className="text-mute">on {lead.movie.title}</span>
              <RatingStars value={lead.review.rating} size="sm" />
              <SentimentBadge status={lead.review.sentiment_status} label={lead.review.sentiment_label} />
            </div>
          </Link>

          <div className="flex flex-col lg:col-span-5">
            {others.map(({ review, movie }) => (
              <Link
                key={review.id}
                to={`/movies/${movie.id}#reviews`}
                viewTransition
                className="group grid grid-cols-[64px_minmax(0,1fr)] gap-5 border-b border-line py-6 first:pt-0"
              >
                <span className="block overflow-hidden rounded-lg">
                  <img
                    src={`${TMDB_IMAGE_BASE}/w185${movie.poster_path}`}
                    alt=""
                    loading="lazy"
                    className="aspect-[2/3] w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]"
                  />
                </span>
                <span className="min-w-0">
                  <span className="font-display block text-[22px] leading-tight text-ink">{movie.title}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-mute">
                    {review.username}
                    <RatingStars value={review.rating} size="sm" />
                    <SentimentBadge status={review.sentiment_status} label={review.sentiment_label} />
                  </span>
                  <span className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink/80" style={{ display: "-webkit-box" }}>{review.review_text}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
