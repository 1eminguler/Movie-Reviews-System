import { Link } from 'react-router-dom'
import { getGenreTurkishName } from '../../i18n/genres.ts'
import type { Movie } from '../../types.ts'
import Poster from '../ui/Poster.tsx'
import RatingStars from '../ui/RatingStars.tsx'

interface MovieCardProps {
  movie: Movie
  className?: string
  priority?: boolean
}

export default function MovieCard({
  movie,
  className = '',
}: MovieCardProps) {
  const releaseYear = movie.release_date
    ? movie.release_date.slice(0, 4)
    : null

  const primaryGenre = movie.genre_names[0]
    ? getGenreTurkishName(movie.genre_names[0])
    : null

  return (
    <article
      className={`group movie-card-hover flex flex-col overflow-hidden rounded-lg border border-charcoal-800 bg-charcoal-900/40 p-2.5 transition-colors hover:border-charcoal-700 hover:bg-charcoal-850/60 ${className}`}
    >
      <Link
        to={`/movies/${movie.id}`}
        viewTransition
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector rounded-md"
        aria-label={`${movie.title} (${releaseYear ?? 'Yıl bilinmiyor'}) detayına git`}
      >
        <div className="movie-card-poster relative overflow-hidden rounded-md transition-transform duration-200">
          <Poster
            path={movie.poster_path}
            title={movie.title}
            viewTransitionName={`poster-${movie.id}`}
          />

          {/* Yaş sınırı rozeti (varsa afişin üstünde) */}
          {movie.certification && (
            <span className="absolute top-2 right-2 rounded bg-charcoal-950/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-charcoal-200 backdrop-blur border border-charcoal-700/60">
              {movie.certification}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-1 text-[11px] text-charcoal-400">
            {releaseYear ? <span>{releaseYear}</span> : <span />}
            {primaryGenre && (
              <span className="truncate text-charcoal-400 font-medium">
                {primaryGenre}
              </span>
            )}
          </div>

          <h3 className="mt-1 line-clamp-1 font-serif text-sm font-medium text-charcoal-100 group-hover:text-amber-projector transition-colors">
            {movie.title}
          </h3>

          <div className="mt-2.5 flex items-center justify-between gap-1 whitespace-nowrap text-xs pt-1 border-t border-charcoal-800/60">
            <RatingStars
              value={movie.avg_rating}
              size="sm"
              showValue
              className="shrink-0 whitespace-nowrap"
            />

            <span
              className="tabular-nums text-[11px] text-charcoal-400 whitespace-nowrap shrink-0"
              title={`${movie.review_count} yorum`}
            >
              ({movie.review_count})
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
