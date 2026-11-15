import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/errors.ts'
import { useAuth } from '../auth/useAuth.ts'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
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
      await login({ username: trimmedUsername, password })
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </span>
          <h1 className="font-serif text-2xl font-normal text-charcoal-50">
            Giriş Yap
          </h1>
          <p className="mt-1 text-xs text-charcoal-400">
            Film yorumlarınızı yönetmek ve oy kullanmak için oturum açın
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
              htmlFor="username-input"
              className="block text-xs font-medium text-charcoal-300"
            >
              Kullanıcı Adı
            </label>
            <input
              id="username-input"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3.5 py-2 text-sm text-charcoal-100 placeholder-charcoal-600 transition-colors focus:border-amber-projector focus:outline-none"
              placeholder="kullanici_adi"
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="block text-xs font-medium text-charcoal-300"
            >
              Şifre
            </label>
            <input
              id="password-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-charcoal-700 bg-charcoal-950 px-3.5 py-2 text-sm text-charcoal-100 placeholder-charcoal-600 transition-colors focus:border-amber-projector focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pressable w-full rounded-md bg-amber-projector py-2.5 text-xs font-semibold text-charcoal-950 hover:bg-amber-projector-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-projector disabled:opacity-50"
          >
            {isSubmitting ? 'Giriş Yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-charcoal-400">
          Hesabınız yok mu?{' '}
          <Link
            to="/register"
            state={{ from }}
            className="font-medium text-amber-projector hover:underline"
          >
            Kayıt Olun
          </Link>
        </p>
      </div>
    </div>
  )
}
