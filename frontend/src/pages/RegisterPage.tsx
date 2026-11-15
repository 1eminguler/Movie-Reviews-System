import { motion, useReducedMotion } from 'motion/react'
import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/errors.ts'
import { useAuth } from '../auth/useAuth.ts'
import { FadeUp, RiseWords } from '../components/motion/Reveal.tsx'
import { EASE_ENTER } from '../lib/motion.ts'
import { TMDB_IMAGE_BASE } from '../config.ts'
import { useMovies } from '../hooks/useMovies.ts'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as { from?: string } | undefined)?.from || '/'

  // Sol sütun için en çok yorumlanan filmlerden arka plan görseli olan ilk filmi seç
  const { data: moviesData } = useMovies({
    sort: 'review_count',
    order: 'desc',
    page_size: 12,
  })
  const featuredMovie = moviesData?.items.find((m) => Boolean(m.backdrop_path))
  const backdropUrl = featuredMovie?.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${featuredMovie.backdrop_path}`
    : null
  const releaseYear = featuredMovie?.release_date
    ? featuredMovie.release_date.slice(0, 4)
    : null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setUsernameError(null)
    setEmailError(null)
    setPasswordError(null)
    setErrorMsg(null)

    const trimmedUsername = username.trim()
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      setUsernameError('Username must be between 3 and 50 characters.')
      return
    }

    const trimmedEmail = email.trim()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    const passwordBytes = new TextEncoder().encode(password).length
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (passwordBytes > 72) {
      setPasswordError('Password must be at most 72 bytes.')
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
    <div className="page-gutter pt-10 md:pt-16 pb-12">
      <div className="grid grid-cols-1 gap-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:gap-12">
        {/* Sol sütun: film arka plan görseli */}
        <div className="relative hidden overflow-hidden rounded-2xl bg-panel lg:col-span-7 lg:block">
          {featuredMovie && backdropUrl && (
            <>
              <motion.img
                src={backdropUrl}
                alt={`${featuredMovie.title} backdrop`}
                initial={reduceMotion ? false : { scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.1, ease: EASE_ENTER }}
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night/90 via-night/40 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-8 left-8 right-8">
                <Link
                  to={`/movies/${featuredMovie.id}`}
                  className="group inline-block"
                >
                  <span className="block font-display text-[40px] leading-tight text-ink group-hover:underline">
                    {featuredMovie.title}
                  </span>
                  {releaseYear && (
                    <span className="mt-1 block text-[15px] text-mute">
                      {releaseYear}
                    </span>
                  )}
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Sağ sütun: dikey ortalanmış kayıt formu */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <div className="w-full max-w-[440px]">
            <h1 className="font-display text-[clamp(44px,5vw,72px)] leading-[0.95] text-ink">
              <RiseWords text="Create an" />{' '}
              <em>
                <RiseWords text="account" delay={0.12} />
              </em>
            </h1>

            <FadeUp delay={0.4}>
              <p className="mt-4 text-[15px] text-mute">
                Join Movie Reviews to rate films and share your thoughts.
              </p>
            </FadeUp>

            <FadeUp delay={0.5}>
              {errorMsg && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-neg/40 bg-neg/10 p-3.5 text-[13px] text-neg"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="reg-username-input"
                    className="text-[13px] font-medium text-mute mb-2 block"
                  >
                    Username
                  </label>
                  <input
                    id="reg-username-input"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-invalid={Boolean(usernameError)}
                    aria-describedby={
                      usernameError ? 'reg-username-error' : undefined
                    }
                    className="field"
                    placeholder="3 to 50 characters"
                  />
                  {usernameError && (
                    <p
                      id="reg-username-error"
                      role="alert"
                      className="mt-1.5 text-[13px] text-neg"
                    >
                      {usernameError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-email-input"
                    className="text-[13px] font-medium text-mute mb-2 block"
                  >
                    Email
                  </label>
                  <input
                    id="reg-email-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'reg-email-error' : undefined}
                    className="field"
                    placeholder="name@example.com"
                  />
                  {emailError && (
                    <p
                      id="reg-email-error"
                      role="alert"
                      className="mt-1.5 text-[13px] text-neg"
                    >
                      {emailError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-password-input"
                    className="text-[13px] font-medium text-mute mb-2 block"
                  >
                    Password
                  </label>
                  <input
                    id="reg-password-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      passwordError ? 'reg-password-error' : undefined
                    }
                    className="field"
                    placeholder="At least 8 characters"
                  />
                  {passwordError && (
                    <p
                      id="reg-password-error"
                      role="alert"
                      className="mt-1.5 text-[13px] text-neg"
                    >
                      {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full"
                >
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="mt-6 text-[14px] text-mute">
                Already have an account?{' '}
                <Link
                  to="/login"
                  state={{ from }}
                  className="font-medium text-ink underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    </div>
  )
}
