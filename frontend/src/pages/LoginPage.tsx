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
      setErrorMsg('Username must be between 3 and 50 characters.')
      return
    }

    const passwordBytes = new TextEncoder().encode(password).length
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.')
      return
    }
    if (passwordBytes > 72) {
      setErrorMsg('Password must be at most 72 bytes.')
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
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-[10px] border border-line bg-panel p-6 sm:p-8">
        <div>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-[15px] text-mute">
            Sign in to rate films and manage your reviews.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-5 rounded-[8px] border border-neg/40 bg-night p-3 text-[13px] text-neg"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="username-input"
              className="block text-[13px] font-medium text-ink"
            >
              Username
            </label>
            <input
              id="username-input"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-[8px] border border-line bg-night px-3.5 py-2 text-[15px] text-ink placeholder-mute focus:border-ink focus:outline-none"
              placeholder="your_username"
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="block text-[13px] font-medium text-ink"
            >
              Password
            </label>
            <input
              id="password-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-[8px] border border-line bg-night px-3.5 py-2 text-[15px] text-ink placeholder-mute focus:border-ink focus:outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-[8px] bg-ink py-2.5 text-[15px] font-medium text-night transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-[13px] text-mute">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            state={{ from }}
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
