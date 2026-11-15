export default function Footer() {
  return (
    <footer className="border-t border-charcoal-800/80 bg-charcoal-950 py-8 text-xs text-charcoal-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-medium text-charcoal-300">
          Gece Seansı · Movie Reviews System · CEN317
        </p>
        <p className="max-w-xl leading-relaxed text-charcoal-500">
          Film verileri ve görseller{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-amber-projector hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-projector rounded"
          >
            TMDB
          </a>{' '}
          kaynaklıdır. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  )
}
