// Sunucudan gelen genel form hatası
export default function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-xl border border-neg/40 bg-neg/10 p-3.5 text-[13px] text-neg">
      {message}
    </div>
  )
}
