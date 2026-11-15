import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TMDB_IMAGE_BASE } from '../../config.ts'
import { releaseYear } from '../../lib/format.ts'
import type { Movie } from '../../types.ts'
import { EASE_ENTER } from '../../lib/motion.ts'
import { SectionHeading } from '../movies/PosterRail.tsx'
import RatingStars from '../ui/RatingStars.tsx'
import Skeleton from '../ui/Skeleton.tsx'

// En yüksek puanlılar: numaralı liste; üzerine gelinen ya da odaklanan satırın
// arka planı sağdaki sabit çerçevede belirir
export default function RankedList({ movies, isLoading }: { movies?: Movie[]; isLoading?: boolean }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const list = (movies ?? []).slice(0, 8)
  const current = list[active]

  return (
    <section className="page-gutter py-14" aria-labelledby="ranked-title">
      <SectionHeading id="ranked-title" title={<>Highest <em>rated</em></>} link={{ to: '/movies?sort=avg_rating&order=desc', label: 'See all' }} />
      <p className="-mt-5 mb-8 text-[15px] text-mute">Films with at least five reviews.</p>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <ol className="lg:col-span-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="border-b border-line py-5">
                  <Skeleton variant="text" className="h-8 w-2/3" />
                </li>
              ))
            : list.map((movie, i) => {
                const isActive = i === active
                return (
                  <li key={movie.id} className="border-b border-line first:border-t">
                    <Link
                      to={`/movies/${movie.id}`}
                      viewTransition
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 py-4 sm:grid-cols-[84px_minmax(0,1fr)_auto]"
                    >
                      <span className={`font-display text-[clamp(32px,3.4vw,52px)] leading-none tabular-nums transition-colors duration-200 ${isActive ? 'text-accent' : 'text-line'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className={`font-display block truncate text-[clamp(22px,2.2vw,34px)] leading-tight transition-colors duration-200 ${isActive ? 'text-ink' : 'text-mute'}`}>
                          {movie.title}
                        </span>
                        <span className="mt-1 block truncate text-[14px] text-mute">
                          {[releaseYear(movie), movie.genre_names.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1 text-[13px] text-mute">
                        <RatingStars value={movie.avg_rating} size="sm" showValue />
                        <span className="tabular-nums">{movie.review_count} reviews</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
        </ol>

        <div className="hidden lg:col-span-6 lg:block">
          <div className="sticky top-24 aspect-[4/5] max-h-[calc(100svh-120px)] w-full overflow-hidden rounded-2xl bg-panel">
            <AnimatePresence initial={false}>
              {current?.poster_path && (
                <motion.img
                  key={current.id}
                  src={`${TMDB_IMAGE_BASE}/w780${current.backdrop_path ?? current.poster_path}`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={reduce ? false : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE_ENTER }}
                />
              )}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/10 to-transparent" />
            {current && (
              <div className="absolute inset-x-0 bottom-0 p-8">
                <p className="font-display text-[clamp(40px,4vw,64px)] leading-[0.95]">{current.title}</p>
                {current.overview && <p className="mt-3 line-clamp-2 max-w-[52ch] text-[15px] leading-relaxed text-ink/75">{current.overview}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
