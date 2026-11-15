import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Movie } from '../../types.ts'
import Skeleton from '../ui/Skeleton.tsx'
import MovieCard from './MovieCard.tsx'

interface SectionHeadingProps {
  title: React.ReactNode
  link?: { to: string; label: string }
  id?: string
  children?: React.ReactNode
}

// Bölüm başlığı: büyük serif başlık, sağda tek metin bağlantısı
export function SectionHeading({ title, link, id, children }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h2 id={id} className="font-display text-[clamp(36px,4.4vw,64px)] leading-[0.95]">
        {title}
      </h2>
      <div className="flex items-center gap-4">
        {children}
        {link && (
          <Link to={link.to} className="nav-word">
            {link.label}
          </Link>
        )}
      </div>
    </div>
  )
}

interface PosterRailProps {
  title: React.ReactNode
  movies?: Movie[]
  isLoading?: boolean
  link?: { to: string; label: string }
}

// Yatay afiş şeridi: kaydırılabilir, masaüstünde ok düğmeleriyle bir ekran ilerler
export default function PosterRail({ title, movies, isLoading, link }: PosterRailProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' })
  }

  const arrowBtn = (dir: 1 | -1) => (
    <button
      type="button"
      onClick={() => scrollBy(dir)}
      aria-label={dir === 1 ? 'Scroll right' : 'Scroll left'}
      className="btn btn-ghost hidden h-11! w-11! px-0! md:inline-flex"
    >
      <svg viewBox="0 0 16 16" className={`h-4 w-4 ${dir === -1 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </button>
  )

  return (
    <section className="page-gutter py-14">
      <SectionHeading title={title} link={link}>
        {arrowBtn(-1)}
        {arrowBtn(1)}
      </SectionHeading>
      <div
        ref={trackRef}
        className="no-scrollbar -mx-[clamp(16px,3vw,56px)] flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-[clamp(16px,3vw,56px)] px-[clamp(16px,3vw,56px)] pb-2"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[min(46vw,220px)] shrink-0 space-y-3">
                <Skeleton variant="poster" />
                <Skeleton variant="text" className="w-4/5" />
              </div>
            ))
          : movies?.map((movie) => (
              <MovieCard key={movie.id} movie={movie} className="w-[min(46vw,220px)] shrink-0 snap-start" />
            ))}
      </div>
    </section>
  )
}
