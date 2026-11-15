import { type ChangeEvent, useEffect, useState } from 'react'
import { useGenres } from '../../hooks/useMovies.ts'
import { getGenreTurkishName } from '../../i18n/genres.ts'
import {
  CERTIFICATIONS,
  type Certification,
  MOVIE_SORTS,
  type MovieFilters,
  type MovieSort,
} from '../../types.ts'

interface FilterBarProps {
  filters: MovieFilters
  onFiltersChange: (newFilters: MovieFilters) => void
  className?: string
}

const SORT_LABELS: Record<MovieSort, string> = {
  avg_rating: 'Puan',
  review_count: 'Yorum Sayısı',
  release_date: 'Vizyon Tarihi',
  title: 'Film Adı',
}

export default function FilterBar({
  filters,
  onFiltersChange,
  className = '',
}: FilterBarProps) {
  const { data: genres = [] } = useGenres()
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const [prevSearchFilter, setPrevSearchFilter] = useState(filters.search ?? '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // URL üzerinden arama filtresi değiştiğinde yerel input değerini güncelle
  if ((filters.search ?? '') !== prevSearchFilter) {
    setPrevSearchFilter(filters.search ?? '')
    setSearchInput(filters.search ?? '')
  }

  // Arama metni değiştiğinde 300ms gecikme ile üst bileşene ilet
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search ?? '') !== searchInput.trim()) {
        onFiltersChange({
          ...filters,
          search: searchInput.trim() ? searchInput.trim() : undefined,
          page: 1, // Yeni aramada 1. sayfaya dön
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters, onFiltersChange])

  const handleGenreChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined
    onFiltersChange({ ...filters, genre_id: val, page: 1 })
  }

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = (e.target.value || undefined) as MovieSort | undefined
    onFiltersChange({ ...filters, sort: val, page: 1 })
  }

  const handleOrderChange = () => {
    const currentOrder = filters.order ?? 'desc'
    const nextOrder = currentOrder === 'asc' ? 'desc' : 'asc'
    onFiltersChange({
      ...filters,
      sort: filters.sort ?? 'review_count',
      order: nextOrder,
      page: 1,
    })
  }

  const handleCertificationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = (e.target.value || undefined) as Certification | undefined
    onFiltersChange({ ...filters, certification: val, page: 1 })
  }

  const handleNumberChange = (
    key: 'year_min' | 'year_max' | 'runtime_min' | 'runtime_max',
    val: string,
  ) => {
    const num = val ? Number(val) : undefined
    onFiltersChange({ ...filters, [key]: num, page: 1 })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.genre_id ||
      filters.certification ||
      filters.year_min ||
      filters.year_max ||
      filters.runtime_min ||
      filters.runtime_max ||
      (filters.sort && filters.sort !== 'review_count') ||
      (filters.order && filters.order !== 'desc'),
  )

  const handleReset = () => {
    setSearchInput('')
    setPrevSearchFilter('')
    onFiltersChange({ page: 1 })
  }

  return (
    <div
      className={`rounded-lg border border-charcoal-800 bg-charcoal-900/60 p-4 backdrop-blur ${className}`}
    >
      {/* Ana filtre satırı */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
        {/* Arama */}
        <div className="relative sm:col-span-2 lg:col-span-5">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Film adı veya açıklamayla ara…"
            className="w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3.5 py-2 pl-9 text-sm text-charcoal-100 placeholder-charcoal-500 transition-colors focus:border-amber-projector focus:outline-none"
            aria-label="Film arama"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-charcoal-500"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Tür */}
        <div className="lg:col-span-3">
          <select
            value={filters.genre_id ?? ''}
            onChange={handleGenreChange}
            aria-label="Tür filtresi"
            className="w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3 py-2 text-sm text-charcoal-200 transition-colors focus:border-amber-projector focus:outline-none"
          >
            <option value="">Tüm Türler</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {getGenreTurkishName(g.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Sıralama */}
        <div className="flex items-center gap-1.5 lg:col-span-3">
          <select
            value={filters.sort ?? 'review_count'}
            onChange={handleSortChange}
            aria-label="Sıralama ölçütü"
            className="w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3 py-2 text-sm text-charcoal-200 transition-colors focus:border-amber-projector focus:outline-none"
          >
            {MOVIE_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleOrderChange}
            title={filters.order === 'asc' ? 'Artan sıra' : 'Azalan sıra'}
            aria-label={filters.order === 'asc' ? 'Artan sıralama' : 'Azalan sıralama'}
            className="btn-pressable inline-flex h-9.5 w-10 shrink-0 items-center justify-center rounded-md border border-charcoal-700 bg-charcoal-950 text-charcoal-300 hover:border-amber-projector hover:text-amber-projector"
          >
            {filters.order === 'asc' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m4.5 4.5 3-3m0 0 3 3m-3-3v8.25" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5 3 3m0 0 3-3m-3 3V3" />
              </svg>
            )}
          </button>
        </div>

        {/* Gelişmiş filtreleri aç/kapa */}
        <div className="lg:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            aria-expanded={showAdvanced}
            title="Detaylı filtreler"
            className={`btn-pressable inline-flex h-9.5 w-full items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium ${
              showAdvanced || filters.certification || filters.year_min || filters.year_max || filters.runtime_min || filters.runtime_max
                ? 'border-amber-projector/60 bg-amber-projector/10 text-amber-projector'
                : 'border-charcoal-700 bg-charcoal-950 text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            <span className="lg:hidden">Filtreler</span>
          </button>
        </div>
      </div>

      {/* Gelişmiş filtre paneli */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-charcoal-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Yaş Sınıflandırması */}
          <div>
            <label className="block mb-1 font-medium text-charcoal-400">
              Yaş Sınırı
            </label>
            <select
              value={filters.certification ?? ''}
              onChange={handleCertificationChange}
              className="w-full rounded border border-charcoal-700 bg-charcoal-950 px-2.5 py-1.5 text-charcoal-200 focus:border-amber-projector focus:outline-none"
            >
              <option value="">Tümü</option>
              {CERTIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Yıl aralığı */}
          <div>
            <label className="block mb-1 font-medium text-charcoal-400">
              Yıl Aralığı
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1900"
                max="2035"
                placeholder="Min"
                value={filters.year_min ?? ''}
                onChange={(e) => handleNumberChange('year_min', e.target.value)}
                className="w-full rounded border border-charcoal-700 bg-charcoal-950 px-2 py-1.5 text-charcoal-200 placeholder-charcoal-600 focus:border-amber-projector focus:outline-none"
              />
              <span className="text-charcoal-600">–</span>
              <input
                type="number"
                min="1900"
                max="2035"
                placeholder="Maks"
                value={filters.year_max ?? ''}
                onChange={(e) => handleNumberChange('year_max', e.target.value)}
                className="w-full rounded border border-charcoal-700 bg-charcoal-950 px-2 py-1.5 text-charcoal-200 placeholder-charcoal-600 focus:border-amber-projector focus:outline-none"
              />
            </div>
          </div>

          {/* Süre aralığı (dk) */}
          <div>
            <label className="block mb-1 font-medium text-charcoal-400">
              Süre (dakika)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="600"
                placeholder="Min dk"
                value={filters.runtime_min ?? ''}
                onChange={(e) => handleNumberChange('runtime_min', e.target.value)}
                className="w-full rounded border border-charcoal-700 bg-charcoal-950 px-2 py-1.5 text-charcoal-200 placeholder-charcoal-600 focus:border-amber-projector focus:outline-none"
              />
              <span className="text-charcoal-600">–</span>
              <input
                type="number"
                min="1"
                max="600"
                placeholder="Maks dk"
                value={filters.runtime_max ?? ''}
                onChange={(e) => handleNumberChange('runtime_max', e.target.value)}
                className="w-full rounded border border-charcoal-700 bg-charcoal-950 px-2 py-1.5 text-charcoal-200 placeholder-charcoal-600 focus:border-amber-projector focus:outline-none"
              />
            </div>
          </div>

          {/* Temizle butonu */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="btn-pressable w-full rounded border border-charcoal-700 bg-charcoal-850 py-1.5 text-xs text-charcoal-300 hover:border-amber-projector/40 hover:text-amber-projector"
              >
                Filtreleri Sıfırla
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
