import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import type { PageParams, Paginated, Review, ReviewCreate, ReviewUpdate } from '../types.ts'

// Duygu analizi arka planda sürer; bekleyen yorum varsa liste kısa aralıkla yenilenir
const PENDING_REFETCH_MS = 3000

function refetchWhilePending(data: Paginated<Review> | undefined): number | false {
  const hasPending = data?.items.some((review) => review.sentiment_status === 'pending')
  return hasPending ? PENDING_REFETCH_MS : false
}

export function useMovieReviews(movieId: number, params: PageParams = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.movie(movieId, params),
    queryFn: () => getMovieReviews(movieId, params),
    refetchInterval: (query) => refetchWhilePending(query.state.data),
  })
}

export function useMyReviews(params: PageParams = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.myList(params),
    queryFn: () => getMyReviews(params),
    refetchInterval: (query) => refetchWhilePending(query.state.data),
  })
}

export function useMyReview(movieId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reviews.mine(movieId),
    queryFn: () => getMyReview(movieId),
    enabled,
  })
}

export function useSentimentSummary(movieId: number) {
  return useQuery({
    queryKey: queryKeys.sentimentSummary(movieId),
    queryFn: () => getSentimentSummary(movieId),
    refetchInterval: (query) => ((query.state.data?.pending ?? 0) > 0 ? PENDING_REFETCH_MS : false),
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
