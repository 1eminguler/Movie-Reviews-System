import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { TMDB_IMAGE_BASE } from '../../config.ts'
import { releaseYear } from '../../lib/format.ts'
import type { Movie } from '../../types.ts'
import RatingStars from '../ui/RatingStars.tsx'
import Skeleton from '../ui/Skeleton.tsx'
import './ChromaMovieGrid.css'

const GRID = 'grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]'

// Film ızgarası: afişler gri durur, imleci izleyen yumuşak ışık altındaki afişlere rengi geri verir
export default function ChromaMovieGrid({ movies, isLoading, skeletonCount = 24 }: { movies?: Movie[]; isLoading?: boolean; skeletonCount?: number }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const placeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, primed: false }
    let raf = 0
    let last = 0

    // Her afişin ızgaraya göre konumu: maske merkezi afişin kendi koordinatına çevrilir
    const place = () => {
      const box = root.getBoundingClientRect()
      root.querySelectorAll<HTMLElement>('[data-chroma-area]').forEach((node) => {
        const rect = node.getBoundingClientRect()
        node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`)
        node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`)
      })
    }
    placeRef.current = place

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const follow = reduce ? 1 : 1 - Math.exp(-dt / 0.14)
      state.x += (state.tx - state.x) * follow
      state.y += (state.ty - state.y) * follow
      const span = state.target > state.power ? 0.1 : 0.22
      state.power += (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span))
      root.style.setProperty('--chroma-x', `${state.x.toFixed(1)}px`)
      root.style.setProperty('--chroma-y', `${state.y.toFixed(1)}px`)
      root.style.setProperty('--chroma-power', state.power.toFixed(3))
      const settled = Math.abs(state.tx - state.x) < 0.2 && Math.abs(state.ty - state.y) < 0.2 && Math.abs(state.target - state.power) < 0.003
      if (settled) last = 0
      else raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const box = root.getBoundingClientRect()
      state.tx = event.clientX - box.left
      state.ty = event.clientY - box.top
      if (!state.primed || state.power < 0.02) {
        state.x = state.tx
        state.y = state.ty
        state.primed = true
      }
      state.target = 1
      wake()
    }
    const onLeave = () => {
      state.target = 0
      wake()
    }

    const resize = new ResizeObserver(place)
    resize.observe(root)
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    place()
    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      placeRef.current = null
    }
  }, [])

  useLayoutEffect(() => {
    placeRef.current?.()
  })

  return (
    <div ref={rootRef} className="chroma-movies">
      {isLoading ? (
        <div className={GRID}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton variant="poster" />
              <Skeleton variant="text" className="w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className={GRID}>
          {(movies ?? []).map((movie) => {
            const year = releaseYear(movie)
            const poster = movie.poster_path ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}` : null
            return (
              <Link
                key={movie.id}
                to={`/movies/${movie.id}`}
                viewTransition
                className="chroma-movies__card group block rounded-xl"
                aria-label={`${movie.title}${year ? ` (${year})` : ''}`}
              >
                <div className="chroma-movies__poster" data-chroma-area="" style={{ viewTransitionName: `poster-${movie.id}` }}>
                  {poster ? (
                    <>
                      <img className="chroma-movies__mono" src={poster} alt="" loading="lazy" />
                      <img className="chroma-movies__color" src={poster} alt="" loading="lazy" aria-hidden="true" />
                      <span className="chroma-movies__glow" aria-hidden="true" />
                    </>
                  ) : (
                    <span className="font-display absolute inset-0 flex items-center justify-center p-4 text-center text-[24px] text-mute">{movie.title}</span>
                  )}
                </div>
                <h3 className="chroma-movies__title mt-3 line-clamp-1 text-[15px] font-medium text-ink/85 transition-colors">{movie.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-[13px] text-mute">{[year, movie.genre_names[0]].filter(Boolean).join(' · ')}</p>
                <div className="mt-1.5 flex items-center justify-between text-[13px] text-mute">
                  <RatingStars value={movie.avg_rating} size="sm" showValue />
                  <span className="tabular-nums">{movie.review_count}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
