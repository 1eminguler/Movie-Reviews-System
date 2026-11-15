import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Counter from '../components/bits/Counter.tsx'
import { RiseWords } from '../components/motion/Reveal.tsx'
import ChromaMovieGrid from '../components/movies/ChromaMovieGrid.tsx'
import FilterBar from '../components/movies/FilterBar.tsx'
import EmptyState from '../components/ui/EmptyState.tsx'
import ErrorState from '../components/ui/ErrorState.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import { useGenres, useMovies } from '../hooks/useMovies.ts'
import { type Certification, MOVIE_SORTS, type MovieFilters, type MovieSort } from '../types.ts'

const PAGE_SIZE = 24

const SORT_LABELS: Record<MovieSort, string> = {
  review_count: 'Most reviewed',
  avg_rating: 'Highest rated',
  release_date: 'Release date',
  title: 'Title',
}

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const genresQuery = useGenres()

  // URL arama parametrelerini MovieFilters nesnesine çevir
  const filters = useMemo<MovieFilters>(() => {
    const num = (key: string) => {
      const v = searchParams.get(key)
      return v ? Number(v) : undefined
    }
    const pageStr = searchParams.get('page')
    return {
      search: searchParams.get('search') ?? undefined,
      genre_id: num('genre_id'),
      certification: (searchParams.get('certification') ?? undefined) as Certification | undefined,
      year_min: num('year_min'),
      year_max: num('year_max'),
      runtime_min: num('runtime_min'),
      runtime_max: num('runtime_max'),
      sort: (searchParams.get('sort') ?? 'review_count') as MovieSort,
      order: (searchParams.get('order') ?? 'desc') as 'asc' | 'desc',
      page: pageStr ? Math.max(1, Number(pageStr)) : 1,
      page_size: PAGE_SIZE,
    }
  }, [searchParams])

  const { data, isPending, isError, error, refetch } = useMovies(filters)

  const handleFiltersChange = useCallback(
    (next: MovieFilters) => {
      const params = new URLSearchParams()
      if (next.search) params.set('search', next.search)
      if (next.genre_id) params.set('genre_id', String(next.genre_id))
      if (next.certification) params.set('certification', next.certification)
      if (next.year_min) params.set('year_min', String(next.year_min))
      if (next.year_max) params.set('year_max', String(next.year_max))
      if (next.runtime_min) params.set('runtime_min', String(next.runtime_min))
      if (next.runtime_max) params.set('runtime_max', String(next.runtime_max))
      if (next.sort) params.set('sort', next.sort)
      if (next.order) params.set('order', next.order)
      if (next.page && next.page > 1) params.set('page', String(next.page))
      setSearchParams(params)
    },
    [setSearchParams],
  )

  const handleReset = useCallback(() => {
    setSearchParams(new URLSearchParams())
    setDrawerOpen(false)
  }, [setSearchParams])

  // Çekmece açıkken Esc kapatır, sayfa kaymaz
  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  const handlePageChange = (page: number) => {
    handleFiltersChange({ ...filters, page })
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const movies = data?.items ?? []
  const total = data?.total ?? 0
  const genres = genresQuery.data ?? []
  const activeGenre = genres.find((g) => g.id === filters.genre_id)
  const extraFilterCount = [filters.search, filters.certification, filters.year_min, filters.year_max, filters.runtime_min, filters.runtime_max].filter(Boolean).length

  const genreButton = (id: number | undefined, label: string) => {
    const isActive = filters.genre_id === id
    return (
      <button
        key={label}
        type="button"
        aria-pressed={isActive}
        onClick={() => handleFiltersChange({ ...filters, genre_id: id, page: 1 })}
        className={`font-display shrink-0 cursor-pointer whitespace-nowrap py-2 text-[clamp(20px,1.7vw,26px)] leading-none transition-colors duration-150 ${
          isActive ? 'text-ink' : 'text-mute/70 hover:text-ink'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="pb-8">
      {/* Başlık: sayfa adı ve filtreye göre yuvarlanan film sayısı */}
      <header className="page-gutter flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pt-10 md:pt-14">
        <h1 className="font-display text-[clamp(56px,9vw,148px)] leading-[0.88]">
          {activeGenre ? <RiseWords key={activeGenre.id} text={activeGenre.name} /> : <RiseWords text="Movies" />}
        </h1>
        <p className="pb-3 text-[17px] text-mute" aria-live="polite">
          <span className="font-display text-[clamp(32px,3.2vw,48px)] leading-none text-ink">
            <Counter value={total} fontSize="1em" duration={0.9} intro={false} />
          </span>{' '}
          {total === 1 ? 'film' : 'films'}
          {filters.search && (
            <>
              {' '}
              for <span className="text-ink">&ldquo;{filters.search}&rdquo;</span>
            </>
          )}
        </p>
      </header>

      {/* Yapışkan tür şeridi ve sıralama: alt kenarı zemine erir, çizgi yok */}
      <div className="sticky top-[128px] z-20 mt-8 bg-gradient-to-b from-night via-night/95 to-night/0 pb-6 md:top-[72px]">
        <div className="page-gutter flex items-center gap-6 pt-3">
          <div className="no-scrollbar -my-2 flex min-w-0 flex-1 items-center gap-6 overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)]">
            {genreButton(undefined, 'All')}
            {genres.map((g) => genreButton(g.id, g.name))}
          </div>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <label htmlFor="movies-sort" className="sr-only">Sort by</label>
            <select
              id="movies-sort"
              value={filters.sort ?? 'review_count'}
              onChange={(e) => handleFiltersChange({ ...filters, sort: e.target.value as MovieSort, page: 1 })}
              className="field h-11! w-auto! cursor-pointer rounded-full! pr-8"
            >
              {MOVIE_SORTS.map((s) => (
                <option key={s} value={s}>{SORT_LABELS[s]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleFiltersChange({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc', page: 1 })}
              aria-label={filters.order === 'asc' ? 'Ascending order, switch to descending' : 'Descending order, switch to ascending'}
              className="btn btn-ghost h-11! w-11! px-0!"
            >
              <svg viewBox="0 0 16 16" className={`h-4 w-4 transition-transform duration-200 ${filters.order === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M8 3v10M4 9l4 4 4-4" />
              </svg>
            </button>
          </div>
          <button type="button" onClick={() => setDrawerOpen(true)} className="btn btn-ghost btn-sm shrink-0">
            More filters{extraFilterCount > 0 && <span className="rounded-full bg-accent px-2 text-[12px] text-white">{extraFilterCount}</span>}
          </button>
        </div>
      </div>

      <div className="page-gutter">
        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} title="Could not load films" />
        ) : !isPending && movies.length === 0 ? (
          <EmptyState
            title="No films match your filters"
            description="Try another genre, or clear the search and filters."
            action={<button type="button" onClick={handleReset} className="btn btn-ghost">Reset filters</button>}
          />
        ) : (
          <>
            <ChromaMovieGrid movies={movies} isLoading={isPending} skeletonCount={PAGE_SIZE} />
            <Pagination page={filters.page ?? 1} total={total} pageSize={PAGE_SIZE} onPageChange={handlePageChange} className="pt-14" />
          </>
        )}
      </div>

      {/* Ek filtreler çekmecesi: sağdan kayar */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="More filters">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 right-0 flex w-[min(420px,100vw)] flex-col overflow-y-auto bg-panel p-8"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%', transition: { duration: 0.2 } }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-display text-[36px] leading-none">More <em>filters</em></h2>
                <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-ghost h-11! w-11! px-0!" aria-label="Close filters">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mb-6 lg:hidden">
                <label htmlFor="movies-sort-drawer" className="mb-2 block text-[13px] font-medium text-mute">Sort by</label>
                <select
                  id="movies-sort-drawer"
                  value={filters.sort ?? 'review_count'}
                  onChange={(e) => handleFiltersChange({ ...filters, sort: e.target.value as MovieSort, page: 1 })}
                  className="field cursor-pointer"
                >
                  {MOVIE_SORTS.map((s) => (
                    <option key={s} value={s}>{SORT_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <FilterBar filters={filters} onFiltersChange={handleFiltersChange} onReset={handleReset} showGenres={false} />
              <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-primary mt-8 w-full">
                Show {total.toLocaleString('en-US')} {total === 1 ? 'film' : 'films'}
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
