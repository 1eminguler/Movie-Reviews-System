import { Outlet } from 'react-router-dom'
import Footer from './Footer.tsx'
import Navbar from './Navbar.tsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
