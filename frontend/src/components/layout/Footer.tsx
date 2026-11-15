import { useRef } from 'react'
import { Link } from 'react-router-dom'
import VariableProximity from '../bits/VariableProximity.tsx'
import DemoNote from '../ui/DemoNote.tsx'

export default function Footer() {
  const wordmarkRef = useRef<HTMLAnchorElement>(null)
  return (
    <footer className="mt-24 bg-gradient-to-b from-night to-panel">
      <div className="page-gutter flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          {/* React Bits VariableProximity: imleç yaklaştıkça harfler kalınlaşır */}
          <Link ref={wordmarkRef} to="/" className="font-display relative block text-[clamp(48px,7vw,112px)] leading-none text-ink" aria-label="Movie Reviews, home">
            <VariableProximity
              label="Movie Reviews"
              containerRef={wordmarkRef}
              fromFontVariationSettings="'wght' 380, 'opsz' 144"
              toFontVariationSettings="'wght' 860, 'opsz' 144"
              radius={180}
              falloff="gaussian"
              fontSize="1em"
              aria-hidden="true"
            />
          </Link>
          <p className="text-[14px] text-mute">CEN317 Engineering Design.</p>
          <DemoNote />
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex gap-7">
            <Link to="/" className="nav-word">Home</Link>
            <Link to="/movies" className="nav-word">Movies</Link>
          </div>
          <p className="max-w-[60ch] text-[13px] leading-relaxed text-mute md:text-right">
            Movie data and images from{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  )
}
