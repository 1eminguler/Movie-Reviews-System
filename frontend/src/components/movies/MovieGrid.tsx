import type { Movie } from '../../types.ts'
import Skeleton from '../ui/Skeleton.tsx'
import MovieCard from './MovieCard.tsx'

interface MovieGridProps {
  movies?: Movie[]
  isLoading?: boolean
  skeletonCount?: number
  className?: string
  enableInitialStagger?: boolean
}

export default function MovieGrid({
  movies,
  isLoading = false,
  skeletonCount = 12,
  className = '',
  enableInitialStagger = false,
}: MovieGridProps) {
  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 ${className}`}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={`skel-${index}`}
            className="flex flex-col rounded-lg border border-charcoal-800 bg-charcoal-900/40 p-2.5"
          >
            <Skeleton variant="poster" />
            <Skeleton variant="text" className="mt-3 h-3 w-1/3" />
            <Skeleton variant="text" className="mt-1.5 h-4 w-4/5" />
            <Skeleton variant="text" className="mt-3 h-3 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!movies || movies.length === 0) {
    return null
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 ${className}`}
    >
      {movies.map((movie, index) => {
        const animationDelay = enableInitialStagger
          ? `${Math.min(index * 35, 380)}ms`
          : undefined

        return (
          <div
            key={movie.id}
            className={enableInitialStagger ? 'animate-card-entrance' : undefined}
            style={animationDelay ? { animationDelay } : undefined}
          >
            <MovieCard movie={movie} />
          </div>
        )
      })}
    </div>
  )
}
