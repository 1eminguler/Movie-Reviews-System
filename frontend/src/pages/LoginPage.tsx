import { motion, useReducedMotion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm.tsx'
import { FadeUp, RiseWords } from '../components/motion/Reveal.tsx'
import { EASE_ENTER } from '../lib/motion.ts'
import { TMDB_IMAGE_BASE } from '../config.ts'
import { useMovies } from '../hooks/useMovies.ts'

export default function LoginPage() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()


  const from = (location.state as { from?: string } | undefined)?.from || '/'

  // Sol sütun için en çok yorumlanan filmlerden arka plan görseli olan ilk filmi seç
  const { data: moviesData } = useMovies({
    sort: 'review_count',
    order: 'desc',
    page_size: 12,
  })
  const featuredMovie = moviesData?.items.find((m) => Boolean(m.backdrop_path))
  const backdropUrl = featuredMovie?.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${featuredMovie.backdrop_path}`
    : null
  const releaseYear = featuredMovie?.release_date
    ? featuredMovie.release_date.slice(0, 4)
    : null

  return (
    <div className="page-gutter pt-10 md:pt-16 pb-12">
      <div className="grid grid-cols-1 gap-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:gap-12">
        {/* Sol sütun: film arka plan görseli */}
        <div className="relative hidden overflow-hidden rounded-2xl bg-panel lg:col-span-7 lg:block">
          {featuredMovie && backdropUrl && (
            <>
              <motion.img
                src={backdropUrl}
                alt={`${featuredMovie.title} backdrop`}
                initial={reduceMotion ? false : { scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.1, ease: EASE_ENTER }}
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night/90 via-night/40 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-8 left-8 right-8">
                <Link
                  to={`/movies/${featuredMovie.id}`}
                  className="group inline-block"
                >
                  <span className="block font-display text-[40px] leading-tight text-ink group-hover:underline">
                    {featuredMovie.title}
                  </span>
                  {releaseYear && (
                    <span className="mt-1 block text-[15px] text-mute">
                      {releaseYear}
                    </span>
                  )}
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Sağ sütun: dikey ortalanmış giriş formu */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <div className="w-full max-w-[440px]">
            <h1 className="font-display text-[clamp(44px,5vw,72px)] leading-[0.95] text-ink">
              <RiseWords text="Sign" />{' '}
              <em>
                <RiseWords text="in" delay={0.06} />
              </em>
            </h1>

            <FadeUp delay={0.4}>
              <p className="mt-4 text-[15px] text-mute">
                Sign in to rate films and manage your reviews.
              </p>
            </FadeUp>

            <FadeUp delay={0.5}>
              <div className="mt-8">
                <LoginForm from={from} />
              </div>

              <p className="mt-6 text-[14px] text-mute">
                No account yet?{' '}
                <Link
                  to="/register"
                  state={{ from }}
                  className="font-medium text-ink underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    </div>
  )
}
