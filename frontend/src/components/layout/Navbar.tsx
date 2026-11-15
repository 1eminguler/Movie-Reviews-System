import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.ts'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export default function Navbar({ overlay = false }: { overlay?: boolean }) {
  const { isAuthenticated, isLoading, logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlSearch = location.pathname === '/movies' ? (searchParams.get('search') ?? '') : ''
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearchQuery(urlSearch)
  }

  // Görselin üzerindeyken şeffaf, sayfa kayınca koyu cam zemine geçer
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMobileMenuOpen(false)
  const solid = !overlay || scrolled || mobileMenuOpen

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    closeMenu()
    navigate(trimmed ? `/movies?search=${encodeURIComponent(trimmed)}` : '/movies')
  }

  const navClass = ({ isActive }: { isActive: boolean }) => `nav-word ${isActive ? 'active' : ''}`

  const searchForm = (id: string) => (
    <form onSubmit={handleSearchSubmit} role="search" className="relative">
      <label htmlFor={id} className="sr-only">Search movies</label>
      <SearchIcon />
      <input
        id={id}
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search films"
        className={`h-11 w-full rounded-full border pl-11 pr-4 text-[15px] text-ink placeholder:text-mute transition-colors focus:border-ink/60 focus:outline-none ${
          solid ? 'border-line bg-panel' : 'border-white/15 bg-black/35 backdrop-blur-md'
        }`}
      />
    </form>
  )

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-300 ${
        solid ? 'border-b border-line bg-night/85 backdrop-blur-xl' : 'border-b border-transparent bg-gradient-to-b from-black/60 to-transparent'
      }`}
    >
      <nav aria-label="Primary navigation" className="page-gutter flex h-[72px] items-center gap-8">
        <Link to="/" onClick={closeMenu} className="font-display shrink-0 text-[26px] leading-none text-ink">
          Movie <em>Reviews</em>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/movies" end className={navClass}>Movies</NavLink>
        </div>

        <div className="ml-auto hidden w-[min(460px,34vw)] md:block">{searchForm('nav-search')}</div>

        <div className="hidden shrink-0 items-center gap-6 md:flex">
          {isLoading ? (
            <div className="h-10 w-32 rounded-full bg-panel" />
          ) : isAuthenticated ? (
            <>
              <NavLink to="/profile" className={navClass}>{user?.username ?? 'Profile'}</NavLink>
              <button type="button" onClick={logout} className="btn btn-ghost btn-sm">Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" state={{ from: location.pathname }} className={navClass}>Sign in</NavLink>
              <Link to="/register" state={{ from: location.pathname }} className="btn btn-light btn-sm">Create account</Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="ml-auto inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 text-ink md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden="true">
            {mobileMenuOpen ? <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" /> : <path strokeLinecap="round" d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </nav>

      <div className="page-gutter pb-3 md:hidden">{searchForm('nav-search-mobile')}</div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
            className="page-gutter h-[calc(100svh-128px)] space-y-8 border-t border-line bg-night pt-8 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {[
                { to: '/', label: 'Home', end: true },
                { to: '/movies', label: 'Movies', end: true },
                ...(isAuthenticated ? [{ to: '/profile', label: 'Profile', end: false }] : []),
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) => `font-display py-1 text-[40px] leading-tight ${isActive ? 'text-ink' : 'text-mute'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-6">
              {isLoading ? null : isAuthenticated ? (
                <button type="button" onClick={() => { closeMenu(); logout() }} className="btn btn-ghost w-full">
                  Sign out {user?.username}
                </button>
              ) : (
                <>
                  <Link to="/register" state={{ from: location.pathname }} onClick={closeMenu} className="btn btn-light w-full">Create account</Link>
                  <Link to="/login" state={{ from: location.pathname }} onClick={closeMenu} className="btn btn-ghost w-full">Sign in</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
