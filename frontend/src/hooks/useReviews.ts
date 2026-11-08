import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { queryKeys } from '../api/queryKeys.ts'
import {
  createReview,
  deleteMyReview,
  getMovieReviews,
  getMyReview,
  getMyReviews,
  getSentimentSummary,
  updateMyReview,
} from '../api/reviews.ts'
import type { PageParams, Review, ReviewCreate, ReviewUpdate } from '../types.ts'

// Yeni yazılan yorumun duygu analizi backend'de arka planda birkaç saniye sürer.
// Seed'den gelen eski yorumlar hiç analiz edilmediği için hep 'pending' kalır;
// bu yüzden yalnızca son birkaç dakikada yazılmış bekleyen yorumlar takip edilir.
const PENDING_REFETCH_MS = 3000
const PENDING_WINDOW_MS = 2 * 60 * 1000

function isFreshPending(review: Review): boolean {
  return (
    review.sentiment_status === 'pending' &&
    Date.now() - Date.parse(review.updated_at) < PENDING_WINDOW_MS
  )
}

function refetchWhilePending(reviews: Review[] | undefined): number | false {
  return reviews?.some(isFreshPending) ? PENDING_REFETCH_MS : false
}

// Takip edilen yorumun analizi bitince ilgili filmin duygu özeti bir kez yenilenir
function useRefreshSummaryWhenAnalyzed(reviews: Review[] | undefined) {
  const queryClient = useQueryClient()
  const trackedRef = useRef(new Set<number>())

  useEffect(() => {
    if (!reviews) {
      return
    }
    const stillPending = new Set<number>()
    for (const review of reviews) {
      if (isFreshPending(review)) {
        stillPending.add(review.id)
      } else if (trackedRef.current.has(review.id)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sentimentSummary(review.movie_id) })
      }
    }
    trackedRef.current = stillPending
  }, [reviews, queryClient])
}

export function useMovieReviews(movieId: number, params: PageParams = {}) {
  const query = useQuery({
    queryKey: queryKeys.reviews.movie(movieId, params),
    queryFn: () => getMovieReviews(movieId, params),
    refetchInterval: (query) => refetchWhilePending(query.state.data?.items),
  })
  useRefreshSummaryWhenAnalyzed(query.data?.items)
  return query
}

export function useMyReviews(params: PageParams = {}) {
  const query = useQuery({
    queryKey: queryKeys.reviews.myList(params),
    queryFn: () => getMyReviews(params),
    refetchInterval: (query) => refetchWhilePending(query.state.data?.items),
  })
  useRefreshSummaryWhenAnalyzed(query.data?.items)
  return query
}

export function useMyReview(movieId: number, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.reviews.mine(movieId),
    queryFn: () => getMyReview(movieId),
    enabled,
    refetchInterval: (query) =>
      refetchWhilePending(query.state.data ? [query.state.data] : undefined),
  })
  const review = query.data
  const reviews = useMemo(() => (review ? [review] : undefined), [review])
  useRefreshSummaryWhenAnalyzed(reviews)
  return query
}

export function useSentimentSummary(movieId: number) {
  return useQuery({
    queryKey: queryKeys.sentimentSummary(movieId),
    queryFn: () => getSentimentSummary(movieId),
  })
}

function invalidateReviewQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  movieId: number,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.reviews.movieAll(movieId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.reviews.mine(movieId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.reviews.myListAll })
  queryClient.invalidateQueries({ queryKey: queryKeys.sentimentSummary(movieId) })
  // Ortalama puan ve yorum sayısı değiştiği için film listesi ve detayı da yenilenir
  queryClient.invalidateQueries({ queryKey: queryKeys.movies.all })
}

export function useCreateReview(movieId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ReviewCreate) => createReview(movieId, body),
    onSuccess: () => {
      invalidateReviewQueries(queryClient, movieId)
    },
  })
}

export function useUpdateMyReview(movieId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ReviewUpdate) => updateMyReview(movieId, body),
    onSuccess: () => {
      invalidateReviewQueries(queryClient, movieId)
    },
  })
}

export function useDeleteMyReview(movieId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteMyReview(movieId),
    onSuccess: () => {
      invalidateReviewQueries(queryClient, movieId)
    },
  })
}
