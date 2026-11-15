import { Outlet } from 'react-router-dom'
import Footer from './Footer.tsx'
import Navbar from './Navbar.tsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-charcoal-950 text-charcoal-100 selection:bg-amber-projector selection:text-charcoal-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
