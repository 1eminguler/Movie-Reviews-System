import { Link } from 'react-router-dom'
import type { Movie } from '../../types.ts'
import Poster from '../ui/Poster.tsx'
import RatingStars from '../ui/RatingStars.tsx'

interface MovieCardProps {
  movie: Movie
  className?: string
}

export default function MovieCard({ movie, className = '' }: MovieCardProps) {
  const releaseYear = movie.release_date
    ? movie.release_date.slice(0, 4)
    : null
  const primaryGenre = movie.genre_names[0] ?? null
  const metaText = [releaseYear, primaryGenre].filter(Boolean).join(', ')

  return (
    <article className={`flex flex-col ${className}`}>
      <Link
        to={`/movies/${movie.id}`}
        viewTransition
        className="movie-card-link block rounded-[6px]"
        aria-label={`${movie.title}${releaseYear ? ` (${releaseYear})` : ''}`}
      >
        <div className="movie-card-poster relative">
          <Poster
            path={movie.poster_path}
            title={movie.title}
            viewTransitionName={`poster-${movie.id}`}
          />
        </div>

        <div className="mt-2 space-y-1">
          <h3 className="movie-card-title line-clamp-1 text-[15px] font-medium text-ink/90">
            {movie.title}
          </h3>

          {metaText && (
            <p className="line-clamp-1 text-[13px] text-mute">{metaText}</p>
          )}

          <div className="flex items-center justify-between gap-2 pt-0.5 text-[13px]">
            <RatingStars
              value={movie.avg_rating}
              size="sm"
              showValue
              className="shrink-0 whitespace-nowrap"
            />
            <span
              className="tabular-nums text-[13px] text-mute shrink-0"
              title={`${movie.review_count} ${movie.review_count === 1 ? 'review' : 'reviews'}`}
            >
              {movie.review_count}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
