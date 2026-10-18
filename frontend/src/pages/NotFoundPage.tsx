import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-neutral-400">Aradığınız sayfa bulunamadı.</p>
      <Link to="/" className="mt-6 inline-block text-amber-400 hover:underline">
        Ana sayfaya dön
      </Link>
    </section>
  )
}
