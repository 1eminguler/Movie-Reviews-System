import axios from 'axios'
import type {
  PageParams,
  Paginated,
  Review,
  ReviewCreate,
  ReviewUpdate,
  SentimentSummary,
} from '../types.ts'
import { api, cleanParams } from './client.ts'

function normalizeReviewText(text: string | null | undefined): string | null {
  if (text === undefined || text === null || text.trim() === '') {
    return null
  }
  return text
}

export async function getMovieReviews(
  movieId: number,
  params: PageParams = {},
): Promise<Paginated<Review>> {
  const response = await api.get<Paginated<Review>>(`/movies/${movieId}/reviews`, {
    params: cleanParams(params),
  })
  return response.data
}

export async function createReview(
  movieId: number,
  body: ReviewCreate,
): Promise<Review> {
  const payload: ReviewCreate = {
    rating: body.rating,
    review_text: normalizeReviewText(body.review_text),
  }
  const response = await api.post<Review>(`/movies/${movieId}/reviews`, payload)
  return response.data
}

export async function getMyReview(movieId: number): Promise<Review | null> {
  try {
    const response = await api.get<Review>(`/movies/${movieId}/reviews/me`)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function updateMyReview(
  movieId: number,
  body: ReviewUpdate,
): Promise<Review> {
  const payload: ReviewUpdate = {}
  if (body.rating !== undefined) {
    payload.rating = body.rating
  }
  if (body.review_text !== undefined) {
    payload.review_text = normalizeReviewText(body.review_text)
  }
  const response = await api.patch<Review>(
    `/movies/${movieId}/reviews/me`,
    payload,
  )
  return response.data
}

export async function deleteMyReview(movieId: number): Promise<void> {
  await api.delete(`/movies/${movieId}/reviews/me`)
}

export async function getMyReviews(
  params: PageParams = {},
): Promise<Paginated<Review>> {
  const response = await api.get<Paginated<Review>>('/users/me/reviews', {
    params: cleanParams(params),
  })
  return response.data
}

export async function getSentimentSummary(
  movieId: number,
): Promise<SentimentSummary> {
  const response = await api.get<SentimentSummary>(
    `/movies/${movieId}/sentiment-summary`,
  )
  return response.data
}
