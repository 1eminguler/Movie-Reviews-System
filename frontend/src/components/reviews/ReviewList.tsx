import type { Review } from '../../types.ts'
import EmptyState from '../ui/EmptyState.tsx'
import Pagination from '../ui/Pagination.tsx'
import Skeleton from '../ui/Skeleton.tsx'
import ReviewItem from './ReviewItem.tsx'

interface ReviewListProps {
  reviews?: Review[]
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  currentUserId?: number | null
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
  isDeleting?: boolean
  className?: string
}

export default function ReviewList({
  reviews,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  isLoading = false,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting = false,
  className = '',
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skel-rev-${i}`}
            className="rounded-lg border border-charcoal-800 bg-charcoal-900/40 p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton rounded="full" className="h-8 w-8" />
              <div className="space-y-1">
                <Skeleton variant="text" className="h-3.5 w-24" />
                <Skeleton variant="text" className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        title="Henüz yorum bulunmuyor"
        description="Bu film için henüz kimse yorum yapmamış. Deneyiminizi ilk paylaşan siz olun!"
        className={className}
      />
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ))}
      </div>

      {onPageChange && total > pageSize && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
          className="pt-4"
        />
      )}
    </div>
  )
}
