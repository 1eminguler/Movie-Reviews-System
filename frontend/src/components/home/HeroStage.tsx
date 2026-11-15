import { useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TMDB_IMAGE_BASE } from '../../config.ts'
import { formatRuntime, releaseYear } from '../../lib/format.ts'
import type { Movie } from '../../types.ts'
import CircularCarousel from '../bits/CircularCarousel.tsx'
import LightRays from '../bits/LightRays.tsx'
import { FadeUp, RiseWords } from '../motion/Reveal.tsx'
import RatingStars from '../ui/RatingStars.tsx'

interface HeroStageProps {
  picks: Movie[]
  index: number
  onIndexChange: (index: number) => void
}

// Ana sahne: arka plan görseli yok; yukarıdan düşen ışığın altında haftanın seçkileri
// bir halka olarak döner, öne gelen filmin adı halkanın altında belirir
export default function HeroStage({ picks, index, onIndexChange }: HeroStageProps) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const movie = picks[index]

  const items = useMemo(
    () =>
      picks.map((m) => ({
        src: `${TMDB_IMAGE_BASE}/w342${m.poster_path}`,
        alt: `${m.title} poster`,
        title: m.title,
      })),
    [picks],
  )

  const meta = [releaseYear(movie), movie.genre_names.slice(0, 2).join(', '), formatRuntime(movie.runtime)].filter(Boolean)

  return (
    <section className="relative isolate flex h-[100svh] min-h-[680px] flex-col overflow-hidden bg-night pt-[128px] md:pt-[72px]" aria-labelledby="hero-title">
      {/* Sahne ışığı: üst ortadan halkanın üzerine düşer */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {reduce ? (
          // Azaltılmış harekette WebGL çalışmaz; aynı ışık durağan bir CSS degradesiyle verilir
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_38%_70%_at_50%_-8%,rgb(244_239_230/0.28),rgb(244_239_230/0.06)_55%,transparent_80%)]" />
        ) : (
          <LightRays
            raysOrigin="top-center"
            raysColor="#f4efe6"
            raysSpeed={0.5}
            lightSpread={0.32}
            rayLength={2.4}
            raySharpness={0.18}
            glow={1}
            haze={0.55}
            intensity={0.9}
            fadeDistance={1.1}
            followMouse={false}
            mouseInfluence={0}
            cursorShadow={false}
            clickPulse={false}
            intro
            // Yumuşak ışık düşük çözünürlükte de aynı görünür; piksel sayısı ~%85 azalır, fan dönmez
            maxDevicePixelRatio={0.5}
          />
        )}
      </div>
      {/* Alt kenar bir sonraki bölüme yumuşakça erir; keskin çizgi yok */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-night" aria-hidden="true" />

      <div className="relative mt-8 mb-2 min-h-[280px] flex-1">
        <div className="absolute inset-0">
          <CircularCarousel
            items={items}
            preset="cylinder"
            intro="rise"
            cardWidth={320}
            aspectRatio={2 / 3}
            gap={30}
            tilt={-8}
            perspective={1800}
            autoplay="step"
            interval={6}
            cornerRadius={16}
            fadeColor="#0a0a0d"
            depthFade={0.6}
            innerShade={0.3}
            parallax={0.25}
            onChange={onIndexChange}
            onItemClick={(_, i) => {
              if (i === index) navigate(`/movies/${picks[i].id}`, { viewTransition: true })
            }}
          />
        </div>
      </div>

      <div className="page-gutter relative shrink-0 pb-10 text-center" key={movie.id}>
        <FadeUp className="mb-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[15px] text-mute">
          <span className="text-ink">This week&apos;s picks</span>
          <span className="tabular-nums">
            {String(index + 1).padStart(2, '0')} / {String(picks.length).padStart(2, '0')}
          </span>
          {meta.map((m, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="h-1 w-1 rounded-full bg-mute" aria-hidden="true" />
              {m}
            </span>
          ))}
        </FadeUp>
        <h1 id="hero-title" className="font-display mx-auto max-w-[18ch] text-[clamp(40px,5vw,84px)] leading-[0.95]">
          <RiseWords text={movie.title} />
        </h1>
        <FadeUp delay={0.4} className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[15px]">
          <span className="flex items-center gap-2">
            <RatingStars value={movie.avg_rating} size="md" showValue />
            <span className="text-mute">
              from {movie.review_count} {movie.review_count === 1 ? 'review' : 'reviews'}
            </span>
          </span>
          {movie.director_names[0] && (
            <span className="text-mute">
              Directed by <span className="text-ink">{movie.director_names[0]}</span>
            </span>
          )}
        </FadeUp>
        <FadeUp delay={0.48} className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`/movies/${movie.id}#reviews`} viewTransition className="btn btn-primary">
            Read the reviews
            <svg className="arrow h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
          <Link to={`/movies/${movie.id}#write`} viewTransition className="btn btn-ghost">
            Write a review
          </Link>
        </FadeUp>
      </div>
    </section>
  )
}
