import { useEffect, useState } from 'react'
import { useGenres } from '../../hooks/useMovies.ts'
import {
  CERTIFICATIONS,
  type Certification,
  type MovieFilters,
} from '../../types.ts'

interface FilterBarProps {
  filters: MovieFilters
  onFiltersChange: (newFilters: MovieFilters) => void
  onReset?: () => void
  className?: string
}

export default function FilterBar({
  filters,
  onFiltersChange,
  onReset,
  className = '',
}: FilterBarProps) {
  const { data: genres = [] } = useGenres()
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const [prevSearchFilter, setPrevSearchFilter] = useState(filters.search ?? '')

  // URL arama parametresi değiştiğinde yerel girdi değerini eşitle
  if ((filters.search ?? '') !== prevSearchFilter) {
    setPrevSearchFilter(filters.search ?? '')
    setSearchInput(filters.search ?? '')
  }

  // Arama metni değişiminde 300ms gecikme ile filtreyi güncelle
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      if ((filters.search ?? '') !== trimmed) {
        onFiltersChange({
          ...filters,
          search: trimmed || undefined,
          page: 1,
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters, onFiltersChange])

  const handleGenreSelect = (genreId: number | undefined) => {
    onFiltersChange({ ...filters, genre_id: genreId, page: 1 })
  }

  const handleCertificationToggle = (cert: Certification) => {
    const next = filters.certification === cert ? undefined : cert
    onFiltersChange({ ...filters, certification: next, page: 1 })
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
      filters.runtime_max,
  )

  const handleReset = () => {
    setSearchInput('')
    setPrevSearchFilter('')
    if (onReset) {
      onReset()
    } else {
      onFiltersChange({
        sort: filters.sort,
        order: filters.order,
        page: 1,
      })
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Arama */}
      <div>
        <label
          htmlFor="filter-search-input"
          className="block text-[13px] font-medium text-ink mb-2"
        >
          Search
        </label>
        <input
          id="filter-search-input"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search films…"
          className="w-full rounded-[8px] border border-line bg-night px-3 py-2 text-[15px] text-ink placeholder-mute focus:border-ink focus:outline-none"
        />
      </div>

      {/* Tür listesi (tekli seçim) */}
      <div>
        <span className="block text-[13px] font-medium text-ink mb-2">
          Genre
        </span>
        <ul className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <li>
            <button
              type="button"
              onClick={() => handleGenreSelect(undefined)}
              className={`w-full cursor-pointer text-left py-1 text-[13px] transition-colors ${
                filters.genre_id === undefined
                  ? 'font-medium text-butter'
                  : 'text-mute hover:text-ink'
              }`}
            >
              All genres
            </button>
          </li>
          {genres.map((genre) => {
            const isSelected = filters.genre_id === genre.id
            return (
              <li key={genre.id}>
                <button
                  type="button"
                  onClick={() =>
                    handleGenreSelect(isSelected ? undefined : genre.id)
                  }
                  className={`w-full cursor-pointer text-left py-1 text-[13px] transition-colors ${
                    isSelected
                      ? 'font-medium text-butter'
                      : 'text-mute hover:text-ink'
                  }`}
                >
                  {genre.name}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Yaş sınırı */}
      <div>
        <span className="block text-[13px] font-medium text-ink mb-2">
          Age rating
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CERTIFICATIONS.map((cert) => {
            const isSelected = filters.certification === cert
            return (
              <button
                key={cert}
                type="button"
                onClick={() => handleCertificationToggle(cert)}
                aria-pressed={isSelected}
                className={`cursor-pointer rounded-[8px] border px-2.5 py-1 text-[13px] font-medium transition-colors ${
                  isSelected
                    ? 'border-ink bg-ink text-night'
                    : 'border-line bg-transparent text-mute hover:border-mute hover:text-ink'
                }`}
              >
                {cert}
              </button>
            )
          })}
        </div>
      </div>

      {/* Yıl aralığı */}
      <div>
        <span className="block text-[13px] font-medium text-ink mb-2">
          Year
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1900"
            max="2035"
            placeholder="From"
            aria-label="Year from"
            value={filters.year_min ?? ''}
            onChange={(e) => handleNumberChange('year_min', e.target.value)}
            className="w-full rounded-[8px] border border-line bg-night px-2.5 py-1.5 text-[13px] tabular-nums text-ink placeholder-mute focus:border-ink focus:outline-none"
          />
          <span className="text-mute" aria-hidden="true">
            –
          </span>
          <input
            type="number"
            min="1900"
            max="2035"
            placeholder="To"
            aria-label="Year to"
            value={filters.year_max ?? ''}
            onChange={(e) => handleNumberChange('year_max', e.target.value)}
            className="w-full rounded-[8px] border border-line bg-night px-2.5 py-1.5 text-[13px] tabular-nums text-ink placeholder-mute focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {/* Süre aralığı */}
      <div>
        <span className="block text-[13px] font-medium text-ink mb-2">
          Runtime (min)
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="600"
            placeholder="Min"
            aria-label="Runtime minimum minutes"
            value={filters.runtime_min ?? ''}
            onChange={(e) => handleNumberChange('runtime_min', e.target.value)}
            className="w-full rounded-[8px] border border-line bg-night px-2.5 py-1.5 text-[13px] tabular-nums text-ink placeholder-mute focus:border-ink focus:outline-none"
          />
          <span className="text-mute" aria-hidden="true">
            –
          </span>
          <input
            type="number"
            min="1"
            max="600"
            placeholder="Max"
            aria-label="Runtime maximum minutes"
            value={filters.runtime_max ?? ''}
            onChange={(e) => handleNumberChange('runtime_max', e.target.value)}
            className="w-full rounded-[8px] border border-line bg-night px-2.5 py-1.5 text-[13px] tabular-nums text-ink placeholder-mute focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      {/* Filtreleri sıfırla */}
      <button
        type="button"
        onClick={handleReset}
        disabled={!hasActiveFilters}
        className="w-full cursor-pointer rounded-[8px] border border-line bg-transparent py-2 text-[13px] font-medium text-ink transition-colors hover:border-mute disabled:cursor-default disabled:opacity-40"
      >
        Reset filters
      </button>
    </div>
  )
}
