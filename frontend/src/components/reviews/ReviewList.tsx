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
            className="rounded-[10px] border border-line bg-panel p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton variant="text" className="h-4 w-32" />
              <Skeleton variant="text" className="h-4 w-24" />
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
        title="No reviews yet"
        description="Be the first to share your thoughts on this film."
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
