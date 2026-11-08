import type { DirectorSearch, MovieFilters, PageParams } from '../types.ts'

export const queryKeys = {
  me: ['me'] as const,
  movies: {
    all: ['movies'] as const,
    list: (filters: MovieFilters) => ['movies', 'list', filters] as const,
    detail: (id: number) => ['movies', 'detail', id] as const,
  },
  genres: ['genres'] as const,
  directors: (params: DirectorSearch) => ['directors', params] as const,
  reviews: {
    movie: (movieId: number, params: PageParams) =>
      ['reviews', 'movie', movieId, params] as const,
    movieAll: (movieId: number) => ['reviews', 'movie', movieId] as const,
    mine: (movieId: number) => ['reviews', 'mine', movieId] as const,
    mineAll: ['reviews', 'mine'] as const,
    myList: (params: PageParams) => ['reviews', 'my-list', params] as const,
    myListAll: ['reviews', 'my-list'] as const,
  },
  sentimentSummary: (movieId: number) =>
    ['sentiment-summary', movieId] as const,
}
