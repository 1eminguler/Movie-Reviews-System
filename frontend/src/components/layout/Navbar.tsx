import { type FormEvent, useState } from 'react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.ts'

export default function Navbar() {
  const { isAuthenticated, isLoading, logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlSearch =
    location.pathname === '/movies' ? (searchParams.get('search') ?? '') : ''
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearchQuery(urlSearch)
  }

  const closeMenu = () => setMobileMenuOpen(false)

  // Aktif bağlantı yalnızca metin rengini değiştirir
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[15px] font-medium whitespace-nowrap transition-colors ${
      isActive ? 'text-butter' : 'text-mute hover:text-ink'
    }`

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    closeMenu()
    if (trimmed) {
      navigate(`/movies?search=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/movies')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-night">
      <nav
        role="navigation"
        aria-label="Primary navigation"
        className="page-gutter flex items-center justify-between gap-6 py-3.5"
      >
        {/* Sol: Marka ve ana bağlantılar */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            to="/"
            onClick={closeMenu}
            className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink whitespace-nowrap rounded"
          >
            Movie Reviews
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/movies" className={navLinkClass}>
              Movies
            </NavLink>
          </div>
        </div>

        {/* Orta: Genişleyen arama kutusu (masaüstü) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:block min-w-0 flex-1"
          role="search"
        >
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies…"
              aria-label="Search movies"
              className="w-full rounded-[8px] border border-line bg-panel py-1.5 pl-9 pr-3 text-[15px] text-ink placeholder-mute focus:border-ink focus:outline-none"
            />
          </div>
        </form>

        {/* Sağ: Oturum alanı (masaüstü) */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {isLoading ? (
            <div className="h-8 w-24 rounded-[8px] bg-panel" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
              <span className="text-[15px] text-ink">{user?.username}</span>
              <button
                type="button"
                onClick={logout}
                className="cursor-pointer rounded-[8px] border border-line bg-transparent px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-mute"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <NavLink
                to="/login"
                state={{ from: location.pathname }}
                className={navLinkClass}
              >
                Sign in
              </NavLink>
              <Link
                to="/register"
                state={{ from: location.pathname }}
                className="inline-flex items-center rounded-[8px] bg-ink px-3.5 py-1.5 text-[15px] font-medium text-night transition-opacity hover:opacity-90"
              >
                Create account
              </Link>
            </div>
          )}
        </div>

        {/* Mobil menü açma düğmesi */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-line bg-transparent text-ink hover:border-mute"
          >
            {mobileMenuOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobil arama çubuğu */}
      <div className="md:hidden page-gutter pb-3">
        <form onSubmit={handleSearchSubmit} role="search">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies…"
              aria-label="Search movies"
              className="w-full rounded-[8px] border border-line bg-panel py-1.5 pl-9 pr-3 text-[15px] text-ink placeholder-mute focus:border-ink focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Mobil açılır menü */}
      {mobileMenuOpen && (
        <div className="md:hidden page-gutter border-t border-line bg-panel py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={({ isActive }) =>
                `py-1 text-[15px] font-medium ${
                  isActive ? 'text-butter' : 'text-mute hover:text-ink'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/movies"
              onClick={closeMenu}
              className={({ isActive }) =>
                `py-1 text-[15px] font-medium ${
                  isActive ? 'text-butter' : 'text-mute hover:text-ink'
                }`
              }
            >
              Movies
            </NavLink>
          </div>

          <div className="border-t border-line pt-3">
            {isLoading ? null : isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[13px] text-mute">
                  <span>Signed in as</span>
                  <span className="font-medium text-ink">{user?.username}</span>
                </div>
                <NavLink
                  to="/profile"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block py-1 text-[15px] font-medium ${
                      isActive ? 'text-butter' : 'text-mute hover:text-ink'
                    }`
                  }
                >
                  Profile
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    logout()
                  }}
                  className="w-full cursor-pointer rounded-[8px] border border-line bg-transparent py-2 text-[15px] font-medium text-ink hover:border-mute"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <NavLink
                  to="/login"
                  state={{ from: location.pathname }}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-[8px] border border-line py-2 text-center text-[15px] font-medium ${
                      isActive ? 'text-butter' : 'text-ink'
                    }`
                  }
                >
                  Sign in
                </NavLink>
                <Link
                  to="/register"
                  state={{ from: location.pathname }}
                  onClick={closeMenu}
                  className="block rounded-[8px] bg-ink py-2 text-center text-[15px] font-medium text-night"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
