import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-240px)] flex-col items-start justify-center py-12 space-y-4">
      <span className="font-display text-[64px] font-bold leading-none tracking-[-0.02em] text-mute">
        404
      </span>

      <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
        Page not found
      </h1>

      <p className="max-w-[72ch] text-[15px] text-mute">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>

      <div className="pt-2">
        <Link
          to="/movies"
          className="inline-flex items-center rounded-[8px] bg-ink px-4 py-2 text-[15px] font-medium text-night transition-opacity hover:opacity-90"
        >
          Browse movies
        </Link>
      </div>
    </div>
  )
}
