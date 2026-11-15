import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.ts'

export default function Navbar() {
  const { isAuthenticated, isLoading, logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const closeMenu = () => setMobileMenuOpen(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      isActive
        ? 'bg-charcoal-800 text-amber-projector border border-charcoal-700'
        : 'text-charcoal-300 hover:text-charcoal-100 hover:bg-charcoal-850'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-charcoal-800 bg-charcoal-950/85 backdrop-blur-md">
      <nav
        role="navigation"
        aria-label="Ana Gezinti"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"
      >
        {/* Logo / Başlık */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2.5 font-serif text-lg font-light tracking-wide text-charcoal-100 hover:text-amber-projector transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector rounded"
          >
            {/* Küçük projektör ışığı ikonu */}
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-projector/40 bg-charcoal-900 text-amber-projector">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2.1 2.1m-8.8 8.8-2.1 2.1m0-13 2.1 2.1m8.8 8.8 2.1 2.1" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-normal text-amber-projector">Gece</span>
            <span className="text-charcoal-200">Seansı</span>
          </Link>

          {/* Masaüstü Navigasyon */}
          <div className="hidden md:flex items-center gap-1.5">
            <NavLink to="/" end className={navLinkClass}>
              Ana Sayfa
            </NavLink>
            <NavLink to="/movies" className={navLinkClass}>
              Filmler
            </NavLink>
          </div>
        </div>

        {/* Masaüstü Oturum Durumu */}
        <div className="hidden md:flex items-center gap-2.5">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-charcoal-850" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <NavLink to="/profile" className={navLinkClass}>
                Profil
              </NavLink>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-charcoal-800 bg-charcoal-900 px-3 py-1 text-xs text-charcoal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-projector" />
                <span className="font-medium text-charcoal-200">{user?.username}</span>
              </span>

              <button
                type="button"
                onClick={logout}
                className="btn-pressable rounded-md border border-charcoal-800 px-3 py-1.5 text-xs font-medium text-charcoal-400 hover:border-charcoal-700 hover:text-charcoal-200"
              >
                Çıkış Yap
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                state={{ from: location.pathname }}
                className={navLinkClass}
              >
                Giriş Yap
              </NavLink>
              <Link
                to="/register"
                state={{ from: location.pathname }}
                className="btn-pressable inline-flex items-center rounded-md bg-amber-projector px-3.5 py-1.5 text-xs font-semibold text-charcoal-950 hover:bg-amber-projector-hover"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>

        {/* Mobil Menü Butonu */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Menüyü aç veya kapat"
            className="btn-pressable inline-flex h-9 w-9 items-center justify-center rounded-md border border-charcoal-800 bg-charcoal-900 text-charcoal-300 hover:text-charcoal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector"
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobil Açılır Menü */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-charcoal-800 bg-charcoal-950 px-4 py-4 space-y-3">
          <div className="flex flex-col gap-1">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-charcoal-850 text-amber-projector' : 'text-charcoal-300'
                }`
              }
            >
              Ana Sayfa
            </NavLink>
            <NavLink
              to="/movies"
              onClick={closeMenu}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-charcoal-850 text-amber-projector' : 'text-charcoal-300'
                }`
              }
            >
              Filmler
            </NavLink>
          </div>

          <div className="pt-3 border-t border-charcoal-800">
            {isLoading ? null : isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 text-xs text-charcoal-400">
                  <span>Giriş yapıldı:</span>
                  <span className="font-medium text-charcoal-200">{user?.username}</span>
                </div>
                <NavLink
                  to="/profile"
                  onClick={closeMenu}
                  className="block rounded px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-850 hover:text-charcoal-100"
                >
                  Profilim
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    logout()
                  }}
                  className="w-full text-left rounded px-3 py-2 text-sm font-medium text-sentiment-neg hover:bg-charcoal-850"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <NavLink
                  to="/login"
                  state={{ from: location.pathname }}
                  onClick={closeMenu}
                  className="block text-center rounded border border-charcoal-700 bg-charcoal-900 py-2 text-sm font-medium text-charcoal-200"
                >
                  Giriş Yap
                </NavLink>
                <Link
                  to="/register"
                  state={{ from: location.pathname }}
                  onClick={closeMenu}
                  className="block text-center rounded bg-amber-projector py-2 text-sm font-semibold text-charcoal-950"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
