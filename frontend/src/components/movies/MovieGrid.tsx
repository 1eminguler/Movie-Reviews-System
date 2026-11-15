import type { Movie } from '../../types.ts'
import Skeleton from '../ui/Skeleton.tsx'
import MovieCard from './MovieCard.tsx'

interface MovieGridProps {
  movies?: Movie[]
  isLoading?: boolean
  skeletonCount?: number
  className?: string
}

export default function MovieGrid({
  movies,
  isLoading = false,
  skeletonCount = 24,
  className = '',
}: MovieGridProps) {
  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 ${className}`}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={`skel-${index}`} className="flex flex-col space-y-2">
            <Skeleton variant="poster" />
            <Skeleton variant="text" className="h-4 w-4/5" />
            <Skeleton variant="text" className="h-3 w-1/2" />
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
      className={`grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 ${className}`}
    >
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}
