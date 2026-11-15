import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-320px)] max-w-md flex-col items-center justify-center py-16 text-center">
      {/* Sinema projektörü / boş makara simgesi */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-charcoal-700 bg-charcoal-900 shadow-inner">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          className="h-10 w-10 text-amber-projector"
          aria-hidden="true"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="6" x2="6" y2="18" />
          <line x1="18" y1="6" x2="18" y2="18" />
          <path d="m10 10 4 2-4 2v-4z" />
        </svg>
      </div>

      <span className="font-serif text-6xl font-light text-charcoal-300">
        404
      </span>

      <h1 className="mt-3 font-serif text-2xl font-normal text-charcoal-100">
        Kayıp Sahne
      </h1>

      <p className="mt-2 max-w-xs text-sm text-charcoal-400">
        Aradığınız sayfa film şeridinden çıkarılmış veya hiç çekilmemiş olabilir.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/"
          className="btn-pressable inline-flex items-center rounded-md bg-amber-projector px-4 py-2 text-xs font-semibold text-charcoal-950 hover:bg-amber-projector-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector"
        >
          Ana Sayfaya Dön
        </Link>
        <Link
          to="/movies"
          className="btn-pressable inline-flex items-center rounded-md border border-charcoal-700 bg-charcoal-850 px-4 py-2 text-xs font-medium text-charcoal-200 hover:border-amber-projector/40"
        >
          Filmleri Keşfet
        </Link>
      </div>
    </div>
  )
}
