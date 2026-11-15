import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReviewForm from '../components/reviews/ReviewForm.tsx'
import ReviewList from '../components/reviews/ReviewList.tsx'
import ErrorState from '../components/ui/ErrorState.tsx'
import Poster from '../components/ui/Poster.tsx'
import RatingStars from '../components/ui/RatingStars.tsx'
import SentimentBar from '../components/ui/SentimentBar.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { TMDB_IMAGE_BASE } from '../config.ts'
import { useAuth } from '../auth/useAuth.ts'
import { useMovie } from '../hooks/useMovies.ts'
import { useMovieReviews, useMyReview, useSentimentSummary } from '../hooks/useReviews.ts'
import { getGenreTurkishName } from '../i18n/genres.ts'

function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} dk`
  if (m === 0) return `${h} saat`
  return `${h}s ${m}dk`
}

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const movieId = Number(id)
  const isValidId = Number.isInteger(movieId) && movieId > 0

  const { isAuthenticated, user } = useAuth()
  const [reviewPage, setReviewPage] = useState(1)
  const [isEditingMyReview, setIsEditingMyReview] = useState(false)

  const movieQuery = useMovie(movieId)
  const sentimentQuery = useSentimentSummary(movieId)
  const reviewsQuery = useMovieReviews(movieId, { page: reviewPage, page_size: 10 })
  const myReviewQuery = useMyReview(movieId, isAuthenticated && isValidId)

  if (!isValidId) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-serif text-3xl text-charcoal-100">Geçersiz Film</h1>
        <p className="mt-2 text-sm text-charcoal-400">
          Belirtilen film adresi geçerli bir kimlik numarası içermiyor.
        </p>
        <Link
          to="/movies"
          className="btn-pressable mt-6 inline-flex items-center rounded-md bg-amber-projector px-4 py-2 text-xs font-semibold text-charcoal-950"
        >
          Film Listesine Dön
        </Link>
      </div>
    )
  }

  if (movieQuery.isError) {
    return (
      <div className="py-12">
        <ErrorState
          error={movieQuery.error}
          onRetry={() => movieQuery.refetch()}
          title="Film detayları yüklenemedi"
        />
        <div className="mt-6 text-center">
          <Link to="/movies" className="text-xs text-amber-projector hover:underline">
            ← Tüm filmlere dön
          </Link>
        </div>
      </div>
    )
  }

  if (movieQuery.isPending) {
    return (
      <div className="space-y-8 py-4">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full max-w-[280px] shrink-0">
            <Skeleton variant="poster" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton variant="text" className="h-8 w-2/3" />
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-20 w-full" />
            <Skeleton variant="text" className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  const movie = movieQuery.data
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : null
  const formattedRuntime = formatRuntime(movie.runtime)
  const directorsText =
    movie.director_names.length > 0
      ? movie.director_names.join(', ')
      : 'Yönetmen bilinmiyor'

  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null

  const myReview = myReviewQuery.data

  return (
    <div className="space-y-12">
      {/* Tam genişlikte sinematik hero backdrop alanı */}
      <section className="film-grain relative -mx-4 -mt-6 sm:-mx-6 sm:-mt-8 overflow-hidden border-b border-charcoal-800 bg-charcoal-900 pb-10 pt-16 sm:pt-24">
        {/* Backdrop görseli */}
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-60"
          />
        )}

        {/* Alttan zemine eriyen gradyan ve soldan metin okunurluğu için hafif gradyan */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/50 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-charcoal-950/75 via-charcoal-950/30 to-transparent" />

        {/* Hero içeriği: Afiş + Başlık + Detaylar */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start lg:gap-12">
            {/* Afiş (View Transition uyumlu) */}
            <div className="w-56 shrink-0 self-center md:self-start sm:w-64 lg:w-72 shadow-2xl">
              <Poster
                path={movie.poster_path}
                title={movie.title}
                size="lg"
                viewTransitionName={`poster-${movie.id}`}
                className="shadow-2xl ring-1 ring-charcoal-700/60"
              />
            </div>

            {/* Bilgiler */}
            <div className="flex-1 space-y-5 text-charcoal-200">
              {/* Üst meta etiketler */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {movie.certification && (
                  <span className="rounded border border-charcoal-700 bg-charcoal-900/90 px-2 py-0.5 font-semibold text-charcoal-200">
                    {movie.certification}
                  </span>
                )}
                {releaseYear && (
                  <span className="rounded bg-charcoal-850 px-2 py-0.5 text-charcoal-300">
                    {releaseYear}
                  </span>
                )}
                {formattedRuntime && (
                  <span className="rounded bg-charcoal-850 px-2 py-0.5 text-charcoal-300">
                    {formattedRuntime}
                  </span>
                )}
                {movie.original_language && (
                  <span className="rounded bg-charcoal-850 px-2 py-0.5 uppercase text-charcoal-400">
                    {movie.original_language}
                  </span>
                )}
              </div>

              {/* Film Başlığı */}
              <div>
                <h1 className="font-serif text-3xl font-light tracking-tight text-charcoal-50 sm:text-4xl lg:text-5xl">
                  {movie.title}
                  {releaseYear && (
                    <span className="ml-3 font-normal text-charcoal-400 text-2xl sm:text-3xl">
                      ({releaseYear})
                    </span>
                  )}
                </h1>
                {movie.original_title && movie.original_title !== movie.title && (
                  <p className="mt-1 text-xs italic text-charcoal-400">
                    Orijinal Adı: {movie.original_title}
                  </p>
                )}
              </div>

              {/* Türler */}
              {movie.genre_names.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {movie.genre_names.map((genre) => (
                    <Link
                      key={genre}
                      to={`/movies?genre_id=${movie.genre_ids[movie.genre_names.indexOf(genre)]}`}
                      className="btn-pressable rounded-full border border-charcoal-700/80 bg-charcoal-900/60 px-3 py-1 text-xs text-charcoal-300 hover:border-amber-projector/50 hover:text-amber-projector"
                    >
                      {getGenreTurkishName(genre)}
                    </Link>
                  ))}
                </div>
              )}

              {/* Puan ve Yorum İstatistiği */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-charcoal-800/80">
                <div className="flex items-center gap-3">
                  <RatingStars value={movie.avg_rating} size="lg" />
                  <div className="flex flex-col">
                    <span className="tabular-nums text-lg font-bold text-charcoal-50">
                      {movie.avg_rating !== null ? movie.avg_rating.toFixed(2) : '—'}
                      <span className="text-xs font-normal text-charcoal-500"> / 5.0</span>
                    </span>
                    <span className="text-[11px] text-charcoal-400">
                      {movie.review_count} kullanıcı değerlendirdi
                    </span>
                  </div>
                </div>
              </div>

              {/* Yönetmenler */}
              <div className="text-xs text-charcoal-200 pt-1">
                <span className="font-medium text-charcoal-300">Yönetmen: </span>
                <span className="text-charcoal-200">{directorsText}</span>
              </div>

              {/* Özet */}
              {movie.overview && (
                <div className="space-y-1.5 pt-2 max-w-3xl">
                  <h2 className="font-serif text-sm font-normal text-charcoal-100">
                    Özet
                  </h2>
                  <p className="text-sm leading-relaxed text-charcoal-100">
                    {movie.overview}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Duygu Analizi Özeti */}
      <section className="rounded-xl border border-charcoal-800 bg-charcoal-900/50 p-6 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-normal text-charcoal-100">
              Topluluk Duygu Dağılımı
            </h2>
            <p className="text-xs text-charcoal-400">
              İzleyici yorumlarının yapay zekâ analizine göre genel duygu profili
            </p>
          </div>
        </div>

        <SentimentBar summary={sentimentQuery.data} />
      </section>

      {/* Kullanıcının kendi yorumu veya Yorum Yazma Formu */}
      <section className="space-y-4">
        {isAuthenticated && myReview && !isEditingMyReview ? (
          <div className="rounded-xl border border-amber-projector/30 bg-charcoal-900/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-projector">
                <span className="h-2 w-2 rounded-full bg-amber-projector" />
                Bu Filme Verdiğiniz Puan ve Yorumunuz
              </span>
              <button
                type="button"
                onClick={() => setIsEditingMyReview(true)}
                className="btn-pressable text-xs font-medium text-amber-projector hover:underline"
              >
                Yorumu Düzenle
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <RatingStars value={myReview.rating} size="md" />
              <span className="tabular-nums text-xs font-medium text-charcoal-200">
                {myReview.rating} / 5
              </span>
            </div>

            {myReview.review_text && (
              <p className="mt-2.5 text-sm text-charcoal-200 whitespace-pre-line leading-relaxed">
                {myReview.review_text}
              </p>
            )}
          </div>
        ) : (
          <ReviewForm
            movieId={movie.id}
            existingReview={isEditingMyReview ? myReview : null}
            onSuccess={() => setIsEditingMyReview(false)}
            onCancel={isEditingMyReview ? () => setIsEditingMyReview(false) : undefined}
          />
        )}
      </section>

      {/* Diğer Yorumlar Listesi */}
      <section className="space-y-6 pt-4 border-t border-charcoal-800">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-normal text-charcoal-100">
            İzleyici Yorumları ({movie.review_count})
          </h2>
        </div>

        <ReviewList
          reviews={reviewsQuery.data?.items}
          total={reviewsQuery.data?.total}
          page={reviewPage}
          pageSize={10}
          onPageChange={(p) => setReviewPage(p)}
          isLoading={reviewsQuery.isPending}
          currentUserId={user?.id}
          onEdit={() => setIsEditingMyReview(true)}
        />
      </section>
    </div>
  )
}
