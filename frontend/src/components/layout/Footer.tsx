export default function Footer() {
  return (
    <footer className="border-t border-line bg-night py-6 text-[13px] text-mute">
      <div className="page-gutter flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>Movie Reviews, CEN317 Engineering Design.</p>
        <p>
          Movie data and images from{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline-offset-2 hover:underline rounded"
          >
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </div>
    </footer>
  )
}
