import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import FilterBar from '../components/movies/FilterBar.tsx'
import MovieGrid from '../components/movies/MovieGrid.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import ErrorState from '../components/ui/ErrorState.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import { useMovies } from '../hooks/useMovies.ts'
import type { Certification, MovieFilters, MovieSort } from '../types.ts'

const PAGE_SIZE = 24

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // URL query parametrelerini MovieFilters nesnesine dönüştür
  const filters = useMemo<MovieFilters>(() => {
    const search = searchParams.get('search') ?? undefined
    const genreIdStr = searchParams.get('genre_id')
    const genre_id = genreIdStr ? Number(genreIdStr) : undefined
    const cert = (searchParams.get('certification') ?? undefined) as Certification | undefined
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

  const handleFiltersChange = (newFilters: MovieFilters) => {
    const nextParams = new URLSearchParams()

    if (newFilters.search) nextParams.set('search', newFilters.search)
    if (newFilters.genre_id) nextParams.set('genre_id', String(newFilters.genre_id))
    if (newFilters.certification) nextParams.set('certification', newFilters.certification)
    if (newFilters.year_min) nextParams.set('year_min', String(newFilters.year_min))
    if (newFilters.year_max) nextParams.set('year_max', String(newFilters.year_max))
    if (newFilters.runtime_min) nextParams.set('runtime_min', String(newFilters.runtime_min))
    if (newFilters.runtime_max) nextParams.set('runtime_max', String(newFilters.runtime_max))
    if (newFilters.sort) nextParams.set('sort', newFilters.sort)
    if (newFilters.order) nextParams.set('order', newFilters.order)
    if (newFilters.page && newFilters.page > 1) {
      nextParams.set('page', String(newFilters.page))
    }

    setSearchParams(nextParams)
  }

  const handlePageChange = (newPage: number) => {
    handleFiltersChange({ ...filters, page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const movies = data?.items ?? []
  const total = data?.total ?? 0
  const currentPage = filters.page ?? 1

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight text-charcoal-100 sm:text-3xl">
          Filmler
        </h1>
        <p className="mt-1 text-xs text-charcoal-400">
          Kapsamlı arşivde arayın, türe ve puana göre filtreleyin.
        </p>
      </div>

      {/* Filtre çubuğu */}
      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* İçerik durumu */}
      {isError ? (
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          title="Filmler yüklenemedi"
        />
      ) : !isPending && movies.length === 0 ? (
        <EmptyState
          title="Aramanızla eşleşen film bulunamadı"
          description="Filtre kriterlerinizi genişletmeyi veya farklı bir arama kelimesi denemeyi düşünebilirsiniz."
          action={
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-pressable inline-flex items-center rounded-md border border-charcoal-700 bg-charcoal-850 px-4 py-2 text-xs font-medium text-amber-projector hover:border-amber-projector/40"
            >
              Filtreleri Temizle
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Sonuç bilgisi */}
          {data && (
            <div className="flex items-center justify-between text-xs text-charcoal-400 px-1">
              <span>
                Toplam <strong className="tabular-nums font-semibold text-charcoal-200">{total}</strong> film listeleniyor
              </span>
              <span>
                Sayfa <strong className="tabular-nums font-semibold text-charcoal-200">{currentPage}</strong> / {Math.ceil(total / PAGE_SIZE) || 1}
              </span>
            </div>
          )}

          {/* Film ızgarası */}
          <MovieGrid
            movies={movies}
            isLoading={isPending}
            skeletonCount={PAGE_SIZE}
            enableInitialStagger={currentPage === 1}
          />

          {/* Sayfalama */}
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
  )
}
