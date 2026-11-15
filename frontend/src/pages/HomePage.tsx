import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/movies/MovieCard.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { TMDB_IMAGE_BASE } from '../config.ts'
import { useMovies } from '../hooks/useMovies.ts'
import type { Movie } from '../types.ts'

interface MovieShelfProps {
  title: string
  subtitle?: string
  movies?: Movie[]
  isLoading?: boolean
  viewAllLink: string
}

function MovieShelf({
  title,
  subtitle,
  movies,
  isLoading,
  viewAllLink,
}: MovieShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -480 : 480
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <section className="space-y-4">
      {/* Şerit başlığı ve kontroller */}
      <div className="flex items-end justify-between gap-4 border-b border-charcoal-800/80 pb-3">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-charcoal-100 sm:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-charcoal-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={viewAllLink}
            className="text-xs font-medium text-amber-projector hover:underline"
          >
            Tümünü gör
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label={`${title} önceki filmler`}
              className="btn-pressable inline-flex h-7 w-7 items-center justify-center rounded border border-charcoal-700 bg-charcoal-850 text-charcoal-300 hover:border-amber-projector hover:text-charcoal-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label={`${title} sonraki filmler`}
              className="btn-pressable inline-flex h-7 w-7 items-center justify-center rounded border border-charcoal-700 bg-charcoal-850 text-charcoal-300 hover:border-amber-projector hover:text-charcoal-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Yatay kaydırma alanı */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pb-2 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skel-shelf-${i}`}
              className="w-36 shrink-0 sm:w-44 rounded-lg border border-charcoal-800 bg-charcoal-900/40 p-2.5"
            >
              <Skeleton variant="poster" />
              <Skeleton variant="text" className="mt-2.5 h-3 w-1/3" />
              <Skeleton variant="text" className="mt-1 h-3.5 w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth sm:gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {movies?.map((movie) => (
            <div key={movie.id} className="w-36 shrink-0 sm:w-44">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function HomePage() {
  const topRatedPoolQuery = useMovies({
    sort: 'review_count',
    order: 'desc',
    page_size: 60,
  })

  const mostReviewedQuery = useMovies({
    sort: 'review_count',
    order: 'desc',
    page_size: 12,
  })

  const newReleasesQuery = useMovies({
    sort: 'release_date',
    order: 'desc',
    page_size: 12,
  })

  // En az 5 yorum almış filmleri ortalama puana göre sırala
  const acclaimedMovies = useMemo(() => {
    if (!topRatedPoolQuery.data?.items) return undefined
    return topRatedPoolQuery.data.items
      .filter((m) => m.review_count >= 5)
      .slice()
      .sort(
        (a, b) =>
          (b.avg_rating ?? 0) - (a.avg_rating ?? 0) ||
          b.review_count - a.review_count,
      )
      .slice(0, 12)
  }, [topRatedPoolQuery.data])

  // Hero için en çok yorumlanan ve backdrop görseli olan film seçimi
  const featuredMovie =
    mostReviewedQuery.data?.items.find((m) => Boolean(m.backdrop_path)) ??
    topRatedPoolQuery.data?.items.find((m) => Boolean(m.backdrop_path)) ??
    mostReviewedQuery.data?.items[0]

  const heroBackdropUrl = featuredMovie?.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${featuredMovie.backdrop_path}`
    : null

  return (
    <div className="space-y-14">
      {/* Dergi kapağı tarzında büyük giriş (Hero) */}
      <section className="film-grain relative -mx-4 -mt-6 sm:-mx-6 sm:-mt-8 overflow-hidden rounded-b-2xl border-b border-charcoal-800 bg-charcoal-900 min-h-[460px] sm:min-h-[540px] flex items-end">
        {/* Arka plan görseli ve gradyanlar */}
        {heroBackdropUrl ? (
          <img
            src={heroBackdropUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-charcoal-950 via-charcoal-900 to-charcoal-850" />
        )}

        {/* Alttan zemine eriyen gradyan ve soldan metin okunurluğu için hafif gradyan */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/45 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-charcoal-950/75 via-charcoal-950/25 to-transparent" />

        {/* Hero İçeriği */}
        <div className="relative z-10 w-full max-w-4xl px-6 py-12 sm:px-12 sm:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-projector/30 bg-charcoal-950/70 px-3 py-1 text-xs text-amber-projector backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-projector animate-pulse" />
            Sinema Kulübü ve Duygu Analizi
          </div>

          <h1 className="mt-4 font-serif text-3xl font-light leading-tight tracking-tight text-charcoal-50 sm:text-5xl lg:text-6xl">
            Perdede yankılanan <span className="font-normal italic text-amber-projector">duygular</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-charcoal-100 sm:text-base">
            Yüzlerce film, binlerce izleyici yorumu ve her cümlenin ardındaki gerçek hisler.
            Topluluğun nabzını tutun, derinlikli değerlendirmeleri keşfedin.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/movies"
              className="btn-pressable inline-flex items-center gap-2 rounded-md bg-amber-projector px-5 py-2.5 text-sm font-semibold text-charcoal-950 hover:bg-amber-projector-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector"
            >
              <span>Filmleri Keşfet</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            {featuredMovie && (
              <Link
                to={`/movies/${featuredMovie.id}`}
                viewTransition
                className="btn-pressable inline-flex items-center gap-2 rounded-md border border-charcoal-700 bg-charcoal-950/80 px-4 py-2.5 text-sm font-medium text-charcoal-200 backdrop-blur hover:border-amber-projector/40 hover:text-charcoal-100"
              >
                <span>Öne Çıkan: {featuredMovie.title}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Yatay Şeritler */}
      <div className="space-y-12">
        <MovieShelf
          title="En beğenilenler"
          subtitle="En az 5 yorum almış, en yüksek puanlı filmler"
          movies={acclaimedMovies}
          isLoading={topRatedPoolQuery.isPending}
          viewAllLink="/movies?sort=review_count&order=desc"
        />

        <MovieShelf
          title="En Çok Yorumlananlar"
          subtitle="Topluluğun en çok konuştuğu ve tartıştığı filmler"
          movies={mostReviewedQuery.data?.items}
          isLoading={mostReviewedQuery.isPending}
          viewAllLink="/movies?sort=review_count&order=desc"
        />

        <MovieShelf
          title="Yeni Çıkanlar"
          subtitle="Son dönemde vizyona giren ve gösterimdeki yapımlar"
          movies={newReleasesQuery.data?.items}
          isLoading={newReleasesQuery.isPending}
          viewAllLink="/movies?sort=release_date&order=desc"
        />
      </div>
    </div>
  )
}
