import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer.tsx'
import Navbar from './Navbar.tsx'

// Ana sayfa, film detayı ve giriş/kayıt sayfasında üst bar tam ekran sahnenin üzerine biner
function isOverlayRoute(pathname: string): boolean {
  return pathname === '/' || pathname === '/login' || pathname === '/register' || /^\/movies\/\d+/.test(pathname)
}

export default function Layout() {
  const { pathname } = useLocation()
  const overlay = isOverlayRoute(pathname)

  return (
    <div className="flex min-h-screen flex-col bg-night text-ink">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar overlay={overlay} />
      {!overlay && <div className="h-[128px] md:h-[72px]" aria-hidden="true" />}
      <main id="main" className="w-full flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
