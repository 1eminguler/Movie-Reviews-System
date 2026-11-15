import { useState } from 'react'
import { TMDB_IMAGE_BASE } from '../../config.ts'

interface PosterProps {
  path: string | null
  title: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  viewTransitionName?: string
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/)
  if (words.length === 0 || !words[0]) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export default function Poster({
  path,
  title,
  size = 'md',
  className = '',
  viewTransitionName,
}: PosterProps) {
  const [hasError, setHasError] = useState(false)

  const width = size === 'lg' ? 'w500' : 'w342'
  const imageUrl = path ? `${TMDB_IMAGE_BASE}/${width}${path}` : null

  const style = viewTransitionName ? { viewTransitionName } : undefined

  if (!imageUrl || hasError) {
    return (
      <div
        style={style}
        className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-panel outline outline-1 -outline-offset-1 outline-white/5 flex flex-col items-center justify-center p-3 text-center select-none ${className}`}
        aria-label={`${title} poster unavailable`}
      >
        <span className="font-display text-[28px] text-mute">
          {getInitials(title)}
        </span>
        <span className="mt-2 line-clamp-2 text-[13px] text-mute">
          {title}
        </span>
      </div>
    )
  }

  return (
    <div
      style={style}
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-panel outline outline-1 -outline-offset-1 outline-white/5 ${className}`}
    >
      <img
        src={imageUrl}
        alt={`${title} poster`}
        loading="lazy"
        onError={() => setHasError(true)}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
