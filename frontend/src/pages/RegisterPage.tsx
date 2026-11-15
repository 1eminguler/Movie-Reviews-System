import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/errors.ts'
import { useAuth } from '../auth/useAuth.ts'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as { from?: string } | undefined)?.from || '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedUsername = username.trim()
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      setErrorMsg('Kullanıcı adı 3 ile 50 karakter arasında olmalıdır.')
      return
    }

    const trimmedEmail = email.trim()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi girin.')
      return
    }

    const passwordBytes = new TextEncoder().encode(password).length
    if (password.length < 8) {
      setErrorMsg('Şifre en az 8 karakter olmalıdır.')
      return
    }
    if (passwordBytes > 72) {
      setErrorMsg('Şifre en fazla 72 bayt olabilir.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-280px)] max-w-md flex-col justify-center py-10">
      <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/70 p-6 sm:p-8 backdrop-blur shadow-2xl">
        <div className="text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-projector/40 bg-charcoal-850 text-amber-projector mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </span>
          <h1 className="font-serif text-2xl font-normal text-charcoal-50">
            Hesap Oluşturun
          </h1>
          <p className="mt-1 text-xs text-charcoal-400">
            Gece Seansı kulübüne katılın, izlediğiniz filmlere düşüncelerinizi bırakın
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-sentiment-neg-border bg-sentiment-neg-bg p-3 text-xs text-sentiment-neg"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="reg-username-input"
              className="block text-xs font-medium text-charcoal-300"
            >
              Kullanıcı Adı
            </label>
            <input
              id="reg-username-input"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3.5 py-2 text-sm text-charcoal-100 placeholder-charcoal-600 transition-colors focus:border-amber-projector focus:outline-none"
              placeholder="kullanici_adi (3-50 karakter)"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email-input"
              className="block text-xs font-medium text-charcoal-300"
            >
              E-posta Adresi
            </label>
            <input
              id="reg-email-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3.5 py-2 text-sm text-charcoal-100 placeholder-charcoal-600 transition-colors focus:border-amber-projector focus:outline-none"
              placeholder="ornek@alanadi.com"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password-input"
              className="block text-xs font-medium text-charcoal-300"
            >
              Şifre
            </label>
            <input
              id="reg-password-input"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3.5 py-2 text-sm text-charcoal-100 placeholder-charcoal-600 transition-colors focus:border-amber-projector focus:outline-none"
              placeholder="En az 8 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pressable w-full rounded-md bg-amber-projector py-2.5 text-xs font-semibold text-charcoal-950 hover:bg-amber-projector-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector disabled:opacity-50"
          >
            {isSubmitting ? 'Kayıt Yapılıyor…' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-charcoal-400">
          Zaten bir hesabınız var mı?{' '}
          <Link
            to="/login"
            state={{ from }}
            className="font-medium text-amber-projector hover:underline"
          >
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  )
}
