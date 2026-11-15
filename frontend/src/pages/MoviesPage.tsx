import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FilterBar from '../components/movies/FilterBar.tsx'
import MovieGrid from '../components/movies/MovieGrid.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import ErrorState from '../components/ui/ErrorState.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import { useMovies } from '../hooks/useMovies.ts'
import {
  type Certification,
  MOVIE_SORTS,
  type MovieFilters,
  type MovieSort,
} from '../types.ts'

const PAGE_SIZE = 24

const SORT_LABELS: Record<MovieSort, string> = {
  review_count: 'Most reviewed',
  avg_rating: 'Highest rated',
  release_date: 'Release date',
  title: 'Title',
}

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // URL arama parametrelerini MovieFilters nesnesine çevir
  const filters = useMemo<MovieFilters>(() => {
    const search = searchParams.get('search') ?? undefined
    const genreIdStr = searchParams.get('genre_id')
    const genre_id = genreIdStr ? Number(genreIdStr) : undefined
    const cert = (searchParams.get('certification') ?? undefined) as
      | Certification
      | undefined
    const yMin = searchParams.get('year_min')
    const year_min = yMin ? Number(yMin) : undefined
    const yMax = searchParams.get('year_max')
    const year_max = yMax ? Number(yMax) : undefined
    const rMin = searchParams.get('runtime_min')
    const runtime_min = rMin ? Number(rMin) : undefined
    const rMax = searchParams.get('runtime_max')
    const runtime_max = rMax ? Number(rMax) : undefined
    const sort = (searchParams.get('sort') ?? 'review_count') as MovieSort
    const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc'
    const pageStr = searchParams.get('page')
    const page = pageStr ? Math.max(1, Number(pageStr)) : 1

    return {
      search,
      genre_id,
      certification: cert,
      year_min,
      year_max,
      runtime_min,
      runtime_max,
      sort,
      order,
      page,
      page_size: PAGE_SIZE,
    }
  }, [searchParams])

  const { data, isPending, isError, error, refetch } = useMovies(filters)

  const handleFiltersChange = useCallback(
    (newFilters: MovieFilters) => {
      const nextParams = new URLSearchParams()

      if (newFilters.search) nextParams.set('search', newFilters.search)
      if (newFilters.genre_id)
        nextParams.set('genre_id', String(newFilters.genre_id))
      if (newFilters.certification)
        nextParams.set('certification', newFilters.certification)
      if (newFilters.year_min)
        nextParams.set('year_min', String(newFilters.year_min))
      if (newFilters.year_max)
        nextParams.set('year_max', String(newFilters.year_max))
      if (newFilters.runtime_min)
        nextParams.set('runtime_min', String(newFilters.runtime_min))
      if (newFilters.runtime_max)
        nextParams.set('runtime_max', String(newFilters.runtime_max))
      if (newFilters.sort) nextParams.set('sort', newFilters.sort)
      if (newFilters.order) nextParams.set('order', newFilters.order)
      if (newFilters.page && newFilters.page > 1) {
        nextParams.set('page', String(newFilters.page))
      }

      setSearchParams(nextParams)
    },
    [setSearchParams],
  )

  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
    setMobileFiltersOpen(false)
  }, [setSearchParams])

  const handlePageChange = (newPage: number) => {
    handleFiltersChange({ ...filters, page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (nextSort: MovieSort) => {
    handleFiltersChange({ ...filters, sort: nextSort, page: 1 })
  }

  const handleOrderToggle = () => {
    const nextOrder = filters.order === 'asc' ? 'desc' : 'asc'
    handleFiltersChange({
      ...filters,
      sort: filters.sort ?? 'review_count',
      order: nextOrder,
      page: 1,
    })
  }

  const movies = data?.items ?? []
  const total = data?.total ?? 0
  const currentPage = filters.page ?? 1

  return (
    <div className="flex flex-col md:flex-row items-start gap-6">
      {/* Masaüstü yapışkan yan filtre paneli */}
      <aside className="hidden md:block w-[260px] shrink-0 sticky top-20 rounded-[10px] border border-line bg-panel p-4">
        <FilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />
      </aside>

      {/* Mobil kayar filtre çekmecesi */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="fixed inset-0 bg-night/80"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 w-[280px] max-w-full h-full overflow-y-auto border-r border-line bg-panel p-4">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-display text-[17px] font-semibold text-ink">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="cursor-pointer rounded-[8px] border border-line px-2.5 py-1 text-[13px] text-ink hover:border-mute"
              >
                Close
              </button>
            </div>
            <FilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>
        </div>
      )}

      {/* Sağ ana alan */}
      <div className="min-w-0 flex-1 w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden inline-flex cursor-pointer items-center rounded-[8px] border border-line bg-transparent px-3 py-1.5 text-[13px] font-medium text-ink hover:border-mute"
            >
              Filters
            </button>

            <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
              {isPending && !data ? (
                'Movies'
              ) : (
                <span className="tabular-nums">
                  {total.toLocaleString('en-US')}{' '}
                  {total === 1 ? 'film' : 'films'}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="movies-sort-select" className="text-[13px] text-mute">
              Sort
            </label>
            <select
              id="movies-sort-select"
              value={filters.sort ?? 'review_count'}
              onChange={(e) => handleSortChange(e.target.value as MovieSort)}
              className="rounded-[8px] border border-line bg-panel px-3 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none"
            >
              {MOVIE_SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleOrderToggle}
              aria-label={
                filters.order === 'asc'
                  ? 'Ascending order, switch to descending'
                  : 'Descending order, switch to ascending'
              }
              title={filters.order === 'asc' ? 'Ascending' : 'Descending'}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-panel text-[15px] text-ink transition-colors hover:border-mute"
            >
              {filters.order === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {isError ? (
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            title="Could not load films"
          />
        ) : !isPending && movies.length === 0 ? (
          <EmptyState
            title="No films match your filters"
            description="Try broadening your search or clearing some filters."
            action={
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex cursor-pointer items-center rounded-[8px] border border-line bg-transparent px-4 py-2 text-[15px] font-medium text-ink transition-colors hover:border-mute"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="space-y-6">
            <MovieGrid
              movies={movies}
              isLoading={isPending}
              skeletonCount={PAGE_SIZE}
            />

            <Pagination
              page={currentPage}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              className="pt-4"
            />
          </div>
        )}
      </div>
    </div>
  )
}
