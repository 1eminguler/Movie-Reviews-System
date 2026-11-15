import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm.tsx'
import RegisterForm from '../components/auth/RegisterForm.tsx'
import BorderGlow from '../components/bits/BorderGlow.tsx'
import DriftWall from '../components/bits/DriftWall.tsx'
import RubberSegment from '../components/bits/RubberSegment.tsx'
import DemoNote from '../components/ui/DemoNote.tsx'
import { RiseWords } from '../components/motion/Reveal.tsx'
import { TMDB_IMAGE_BASE } from '../config.ts'
import { useMovies } from '../hooks/useMovies.ts'
import { EASE_ENTER } from '../lib/motion.ts'

type AuthMode = 'login' | 'register'

const COPY: Record<AuthMode, { title: string; lead: string }> = {
  login: { title: 'Sign in', lead: 'Rate films, write reviews and keep them all on your profile.' },
  register: { title: 'Create an account', lead: 'It takes a username, an email and a password.' },
}

// Giriş ve kayıt tek sayfada: ortada cam kart, arkada yavaşça akan gri afiş duvarı.
// Sekme değişince adres de /login ya da /register olur; geri dönülecek sayfa korunur
export default function AuthPage({ mode }: { mode: AuthMode }) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: string } | undefined
  const from = state?.from || '/'

  const { data } = useMovies({ sort: 'review_count', order: 'desc', page_size: 42 })
  const wall = useMemo(
    () =>
      (data?.items ?? [])
        .filter((m) => m.poster_path)
        .map((m) => ({ image: `${TMDB_IMAGE_BASE}/w342${m.poster_path}`, title: m.title })),
    [data],
  )

  const switchTo = (next: string) => {
    if (next === mode) return
    navigate(next === 'login' ? '/login' : '/register', { replace: true, state: { from } })
  }

  const direction = mode === 'register' ? 1 : -1

  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-12 pt-[148px] md:pt-[104px]">
      {/* Arka plan: eğik perspektifte yukarı akan gri afiş duvarı */}
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
        {wall.length > 0 && (
          <DriftWall
            items={wall}
            columns={7}
            tileWidth={172}
            tileHeight={258}
            gap={20}
            radius={12}
            tilt={22}
            turn={-14}
            perspective={1400}
            depth={90}
            speed={reduce ? 0 : 18}
            variance={0.35}
            parallax={0}
            lift={0}
            fade={0.75}
            dim={0.62}
            grayscale
            overlayColor="#0a0a0d"
          />
        )}
      </div>
      {/* Kartın arkası karartılır: duvar kenarlarda görünür, ortada okunurluk korunur */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_50%_55%,rgb(10_10_13/0.92)_0%,rgb(10_10_13/0.55)_55%,rgb(10_10_13/0.15)_100%)]"
        aria-hidden="true"
      />

      {/* Duvar alt ve üst kenarda zemine erir; keskin geçiş yok */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-b from-transparent to-night" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-t from-transparent to-night/90" aria-hidden="true" />

      <motion.div
        className="w-full max-w-[468px]"
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE_ENTER }}
      >
        <BorderGlow
          backgroundColor="#111116"
          glowColor="352 78 62"
          colors={['#e63950', '#f4efe6', '#9e1f33']}
          borderRadius={28}
          glowRadius={36}
          glowIntensity={0.9}
          edgeSensitivity={26}
          fillOpacity={0.25}
          className="w-full"
        >
          <div className="p-7 sm:p-10">
            <div className="flex justify-center">
              <RubberSegment
                aria-label="Choose sign in or create account"
                items={[
                  { value: 'login', label: 'Sign in' },
                  { value: 'register', label: 'Create account' },
                ]}
                value={mode}
                onChange={(value) => switchTo(value)}
                trackColor="#1c1c22"
                thumbColor="#f4efe6"
                textColor="#a19c93"
                activeTextColor="#0a0a0d"
                size="lg"
                equalSlots
              />
            </div>

            <motion.div layout={!reduce} transition={{ duration: 0.35, ease: EASE_ENTER }} className="mt-8 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={reduce ? false : { opacity: 0, x: 28 * direction }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -28 * direction }}
                  transition={{ duration: 0.26, ease: EASE_ENTER }}
                >
                  <h1 className="font-display text-center text-[clamp(38px,4.4vw,52px)] leading-[1]">
                    <RiseWords key={mode} text={COPY[mode].title} />
                  </h1>
                  <p className="mx-auto mt-3 max-w-[34ch] text-center text-[15px] leading-relaxed text-mute">{COPY[mode].lead}</p>
                  <DemoNote className="mt-5 text-center" />
                  <div className="mt-8">{mode === 'login' ? <LoginForm from={from} /> : <RegisterForm from={from} />}</div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </BorderGlow>
      </motion.div>
    </section>
  )
}
