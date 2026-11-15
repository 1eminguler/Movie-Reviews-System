import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ui/ErrorState.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import Poster from '../components/ui/Poster.tsx'
import RatingStars from '../components/ui/RatingStars.tsx'
import SentimentBadge from '../components/ui/SentimentBadge.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { useAuth } from '../auth/useAuth.ts'
import { useMovie } from '../hooks/useMovies.ts'
import { useMyReviews } from '../hooks/useReviews.ts'
import type { Review } from '../types.ts'

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

// Her yorum için film bilgisini yükleyen alt bileşen
function MyReviewRow({ review }: { review: Review }) {
  const { data: movie, isPending } = useMovie(review.movie_id)

  return (
    <article className="flex flex-col sm:flex-row gap-4 rounded-lg border border-charcoal-800 bg-charcoal-900/50 p-4 transition-colors hover:border-charcoal-700">
      {/* Film küçük afişi */}
      <Link
        to={`/movies/${review.movie_id}`}
        viewTransition
        className="w-16 sm:w-20 shrink-0 self-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-projector rounded"
      >
        {isPending ? (
          <Skeleton variant="poster" />
        ) : (
          <Poster
            path={movie?.poster_path ?? null}
            title={movie?.title ?? 'Film'}
            size="sm"
          />
        )}
      </Link>

      {/* Yorum detayları */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={`/movies/${review.movie_id}`}
            viewTransition
            className="font-serif text-base font-normal text-charcoal-100 hover:text-amber-projector transition-colors truncate"
          >
            {movie ? movie.title : `Film #${review.movie_id}`}
          </Link>

          <div className="flex items-center gap-2">
            <RatingStars value={review.rating} size="sm" />
            <SentimentBadge
              status={review.sentiment_status}
              label={review.sentiment_label}
              score={review.sentiment_score}
            />
          </div>
        </div>

        {review.review_text && (
          <p className="text-sm text-charcoal-300 line-clamp-3 leading-relaxed whitespace-pre-line">
            {review.review_text}
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1">
          <time>{formatDate(review.created_at)}</time>
          <Link
            to={`/movies/${review.movie_id}`}
            className="font-medium text-amber-projector hover:underline"
          >
            Filme Git →
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const myReviewsQuery = useMyReviews({ page, page_size: pageSize })
  // İstatistikleri hesaplamak için tüm yorumların genelini çekelim
  const allReviewsQuery = useMyReviews({ page: 1, page_size: 100 })

  const stats = useMemo(() => {
    const items = allReviewsQuery.data?.items ?? []
    const total = allReviewsQuery.data?.total ?? 0

    if (items.length === 0) {
      return {
        total: 0,
        avgRating: 0,
        distribution: [0, 0, 0, 0, 0],
      }
    }

    const sum = items.reduce((acc, curr) => acc + curr.rating, 0)
    const avg = sum / items.length

    const dist = [0, 0, 0, 0, 0] // 1..5 yıldız sayıları
    for (const r of items) {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1
      dist[idx] = (dist[idx] || 0) + 1
    }

    return {
      total,
      avgRating: Number(avg.toFixed(2)),
      distribution: dist, // [1-yıldız, 2-yıldız, 3-yıldız, 4-yıldız, 5-yıldız]
    }
  }, [allReviewsQuery.data])

  const userInitial = (user?.username?.[0] ?? 'K').toUpperCase()

  return (
    <div className="space-y-8">
      {/* Kullanıcı kartı */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-xl border border-charcoal-800 bg-charcoal-900/60 p-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-projector/40 bg-charcoal-850 font-serif text-2xl font-normal text-amber-projector shadow-inner">
            {userInitial}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-normal text-charcoal-50">
              {user?.username}
            </h1>
            <p className="text-xs text-charcoal-400 mt-0.5">{user?.email}</p>
            {user?.created_at && (
              <p className="text-[11px] text-charcoal-500 mt-1">
                Üyelik: {formatDate(user.created_at)}
              </p>
            )}
          </div>
        </div>

        {/* Küçük Özet Sayaçları */}
        <div className="flex items-center gap-6 border-t border-charcoal-800 pt-4 sm:border-t-0 sm:pt-0">
          <div className="text-center">
            <span className="block tabular-nums font-serif text-2xl font-light text-charcoal-100">
              {stats.total}
            </span>
            <span className="text-[11px] text-charcoal-400">Toplam Yorum</span>
          </div>

          <div className="h-8 w-px bg-charcoal-800" />

          <div className="text-center">
            <span className="block tabular-nums font-serif text-2xl font-light text-amber-projector">
              {stats.total > 0 ? stats.avgRating : '—'}
            </span>
            <span className="text-[11px] text-charcoal-400">Ortalama Puan</span>
          </div>
        </div>
      </section>

      {/* Puan Dağılımı İstatistiği */}
      {stats.total > 0 && (
        <section className="rounded-xl border border-charcoal-800 bg-charcoal-900/40 p-5">
          <h2 className="font-serif text-base font-normal text-charcoal-100 mb-3">
            Verdiğiniz Puanların Dağılımı
          </h2>
          <div className="space-y-1.5 max-w-md">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star - 1] || 0
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0

              return (
                <div key={star} className="flex items-center gap-3 text-xs text-charcoal-300">
                  <span className="w-12 tabular-nums flex items-center gap-1 text-charcoal-400">
                    <span>{star}</span>
                    <span className="text-amber-projector">★</span>
                  </span>

                  <div className="relative h-2 flex-1 rounded-full bg-charcoal-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-amber-projector transition-all duration-500"
                    />
                  </div>

                  <span className="w-12 text-right tabular-nums text-charcoal-400">
                    {count} (%{pct})
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Kullanıcının Yorumları */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-normal text-charcoal-100">
          Yorumlarım ({myReviewsQuery.data?.total ?? 0})
        </h2>

        {myReviewsQuery.isError ? (
          <ErrorState
            error={myReviewsQuery.error}
            onRetry={() => myReviewsQuery.refetch()}
            title="Yorumlarınız yüklenemedi"
          />
        ) : myReviewsQuery.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skel-my-rev-${i}`}
                className="flex gap-4 rounded-lg border border-charcoal-800 bg-charcoal-900/40 p-4"
              >
                <Skeleton variant="poster" className="w-16 h-24" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="h-4 w-1/3" />
                  <Skeleton variant="text" className="h-3 w-1/4" />
                  <Skeleton variant="text" className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : myReviewsQuery.data?.items.length === 0 ? (
          <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/40 p-8 text-center">
            <p className="text-sm text-charcoal-300">
              Henüz hiçbir filme yorum yapmadınız veya puan vermediniz.
            </p>
            <Link
              to="/movies"
              className="btn-pressable mt-4 inline-flex items-center rounded-md bg-amber-projector px-4 py-2 text-xs font-semibold text-charcoal-950"
            >
              Filmleri Keşfedin
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myReviewsQuery.data?.items.map((review) => (
              <MyReviewRow key={review.id} review={review} />
            ))}

            <Pagination
              page={page}
              total={myReviewsQuery.data?.total ?? 0}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              className="pt-4"
            />
          </div>
        )}
      </section>
    </div>
  )
}
