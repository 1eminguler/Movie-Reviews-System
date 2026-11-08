import { useParams } from 'react-router-dom'

export default function MovieDetailPage() {
  const { id } = useParams()

  return (
    <section>
      <h1 className="text-2xl font-bold">Film Detayı</h1>
      <p className="mt-2 text-neutral-400">Film #{id} için bilgiler ve yorumlar burada olacak.</p>
    </section>
  )
}
