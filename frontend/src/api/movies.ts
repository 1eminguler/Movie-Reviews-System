import type {
  Director,
  DirectorSearch,
  Genre,
  Movie,
  MovieFilters,
  Paginated,
} from '../types.ts'
import { api, cleanParams } from './client.ts'

export async function getMovies(
  filters: MovieFilters = {},
): Promise<Paginated<Movie>> {
  const response = await api.get<Paginated<Movie>>('/movies', {
    params: cleanParams(filters),
  })
  return response.data
}

export async function getMovie(id: number): Promise<Movie> {
  const response = await api.get<Movie>(`/movies/${id}`)
  return response.data
}

export async function getGenres(): Promise<Genre[]> {
  const response = await api.get<Genre[]>('/genres')
  return response.data
}

export async function getDirectors(
  params: DirectorSearch = {},
): Promise<Director[]> {
  const response = await api.get<Director[]>('/directors', {
    params: cleanParams(params),
  })
  return response.data
}
