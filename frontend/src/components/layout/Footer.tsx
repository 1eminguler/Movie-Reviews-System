export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 py-6 text-sm text-neutral-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>Movie Reviews System · CEN317</p>
        <p>
          Film verileri ve görseller{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sky-400 hover:underline"
          >
            TMDB
          </a>{' '}
          kaynaklıdır. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  )
}
