import { Outlet } from 'react-router-dom'
import Footer from './Footer.tsx'
import Navbar from './Navbar.tsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-night text-ink">
      <Navbar />
      <main className="page-gutter w-full flex-1 py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
