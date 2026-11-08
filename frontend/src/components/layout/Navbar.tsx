import { Link, NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:text-white'
  }`

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-amber-400">
          Movie Reviews
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Ana Sayfa
          </NavLink>
          <NavLink to="/movies" className={linkClass}>
            Filmler
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <NavLink to="/login" className={linkClass}>
            Giriş Yap
          </NavLink>
          <Link
            to="/register"
            className="rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-300"
          >
            Kayıt Ol
          </Link>
        </div>
      </nav>
    </header>
  )
}
