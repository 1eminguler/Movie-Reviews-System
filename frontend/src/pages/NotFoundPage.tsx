import { Link } from 'react-router-dom'
import FuzzyText from '../components/bits/FuzzyText.tsx'
import { FadeUp, RiseWords } from '../components/motion/Reveal.tsx'

export default function NotFoundPage() {
  return (
    <div className="page-gutter pt-10 md:pt-16 pb-16 flex min-h-[calc(100svh-72px)] flex-col items-start justify-end">
      {/* React Bits FuzzyText: titreyen "404", imleç üzerine gelince bozulma artar */}
      <div aria-hidden="true" className="-ml-2 select-none">
        <FuzzyText
          fontSize="clamp(160px, 26vw, 400px)"
          fontFamily="'Fraunces Variable', Georgia, serif"
          fontWeight={420}
          color="#f4efe6"
          baseIntensity={0.14}
          hoverIntensity={0.55}
          enableHover
        >
          404
        </FuzzyText>
      </div>

      <h1 className="mt-4 font-display text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink">
        <RiseWords text="Page" />{' '}
        <em>
          <RiseWords text="not found" delay={0.06} />
        </em>
      </h1>

      <FadeUp delay={0.4}>
        <p className="mt-4 max-w-[65ch] text-[16px] text-mute">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
      </FadeUp>

      <FadeUp delay={0.5}>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/" className="btn btn-primary">
            Go to home
          </Link>
          <Link to="/movies" className="btn btn-ghost">
            Browse films
          </Link>
        </div>
      </FadeUp>
    </div>
  )
}
