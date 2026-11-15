import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { TMDB_IMAGE_BASE } from '../../config.ts'
import { useMovieReviews, useSentimentSummary } from '../../hooks/useReviews.ts'
import { trimQuote } from '../../lib/format.ts'
import type { Movie } from '../../types.ts'
import { EASE_ENTER } from '../../lib/motion.ts'
import RatingStars from '../ui/RatingStars.tsx'
import SentimentBadge from '../ui/SentimentBadge.tsx'
import SentimentBar from '../ui/SentimentBar.tsx'

// Halkanın önündeki film: arka plan görseli, duygu dağılımı ve iki yorum.
// Halka döndükçe bu bölüm de o filme geçer
export default function FrontFilm({ movie }: { movie: Movie }) {
  const reduce = useReducedMotion()
  const summary = useSentimentSummary(movie.id)
  const reviews = useMovieReviews(movie.id, { page_size: 6 })
  const quotes = (reviews.data?.items ?? []).filter((r) => r.review_text?.trim()).slice(0, 2)

  return (
    <section className="page-gutter relative pb-16 pt-6" aria-labelledby="front-title">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        <Link
          to={`/movies/${movie.id}`}
          viewTransition
          className="group relative block aspect-[16/9] overflow-hidden rounded-2xl bg-panel lg:col-span-7"
          aria-label={`Open ${movie.title}`}
        >
          <AnimatePresence initial={false}>
            {movie.backdrop_path && (
              <motion.img
                key={movie.id}
                src={`${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-[var(--ease-out)] group-hover:scale-[1.03]"
                initial={reduce ? false : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE_ENTER }}
              />
            )}
          </AnimatePresence>
        </Link>

        <div className="lg:col-span-5">
          <h2 id="front-title" className="font-display text-[clamp(32px,3.6vw,56px)] leading-[1]">
            What people think of <em>{movie.title}</em>
          </h2>
          <div className="mt-6">
            <SentimentBar summary={summary.data} totalReviews={movie.review_count} />
          </div>

          <div className="mt-8 space-y-6">
            {quotes.map((review) => (
              <figure key={review.id} className="border-l-2 border-accent/70 pl-5">
                <blockquote className="font-display text-[22px] italic leading-snug text-ink/90">
                  &ldquo;{trimQuote(review.review_text!, 200)}&rdquo;
                </blockquote>
                <figcaption className="mt-3 flex flex-wrap items-center gap-3 text-[14px] text-mute">
                  <span className="text-ink">{review.username}</span>
                  <RatingStars value={review.rating} size="sm" />
                  <SentimentBadge status={review.sentiment_status} label={review.sentiment_label} />
                </figcaption>
              </figure>
            ))}
          </div>

          <Link to={`/movies/${movie.id}#reviews`} viewTransition className="nav-word mt-8 inline-block">
            All {movie.review_count} reviews
          </Link>
        </div>
      </div>
    </section>
  )
}
