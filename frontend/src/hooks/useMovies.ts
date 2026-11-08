import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getDirectors,
  getGenres,
  getMovie,
  getMovies,
} from '../api/movies.ts'
import { queryKeys } from '../api/queryKeys.ts'
import type { DirectorSearch, MovieFilters } from '../types.ts'

export function useMovies(filters: MovieFilters = {}) {
  return useQuery({
    queryKey: queryKeys.movies.list(filters),
    queryFn: () => getMovies(filters),
    placeholderData: keepPreviousData,
  })
}

// URL'den gelen geçersiz id (NaN) için istek atılmaz
export function useMovie(id: number) {
  return useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => getMovie(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useGenres() {
  return useQuery({
    queryKey: queryKeys.genres,
    queryFn: getGenres,
    staleTime: Infinity,
  })
}

export function useDirectors(params: DirectorSearch = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.directors(params),
    queryFn: () => getDirectors(params),
    enabled,
  })
}
