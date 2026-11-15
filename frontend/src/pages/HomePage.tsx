import { useMemo, useState } from 'react'
import FrontFilm from '../components/home/FrontFilm.tsx'
import HeroStage from '../components/home/HeroStage.tsx'
import QuoteWall from '../components/home/QuoteWall.tsx'
import RankedList from '../components/home/RankedList.tsx'
import PosterRail from '../components/movies/PosterRail.tsx'
import { useMovies } from '../hooks/useMovies.ts'
import { pickWeekly } from '../lib/weeklyPicks.ts'

export default function HomePage() {
  const poolQuery = useMovies({ sort: 'review_count', order: 'desc', page_size: 60 })
  const mostDiscussedQuery = useMovies({ sort: 'review_count', order: 'desc', page_size: 20 })
  const newReleasesQuery = useMovies({ sort: 'release_date', order: 'desc', page_size: 20 })

  const picks = useMemo(() => pickWeekly(poolQuery.data?.items ?? []), [poolQuery.data])
  const [frontIndex, setFrontIndex] = useState(0)
  const front = picks[frontIndex] ?? picks[0]

  // En yüksek puanlılar: aynı havuzdan en az 5 yorumu olanlar, puana göre
  const highestRated = useMemo(() => {
    const items = poolQuery.data?.items
    if (!items) return undefined
    return items
      .filter((m) => m.review_count >= 5)
      .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0) || b.review_count - a.review_count)
  }, [poolQuery.data])

  const topThree = useMemo(() => (mostDiscussedQuery.data?.items ?? []).slice(0, 3), [mostDiscussedQuery.data])

  return (
    <>
      {front ? (
        <>
          <HeroStage picks={picks} index={frontIndex} onIndexChange={setFrontIndex} />
          <FrontFilm movie={front} />
        </>
      ) : (
        <section className="min-h-[100svh] bg-night" aria-busy="true" aria-label="Loading this week's picks" />
      )}

      <PosterRail
        title={<>Most <em>discussed</em></>}
        movies={mostDiscussedQuery.data?.items}
        isLoading={mostDiscussedQuery.isPending}
        link={{ to: '/movies?sort=review_count&order=desc', label: 'See all' }}
      />

      <QuoteWall topMovies={topThree} />

      <RankedList movies={highestRated} isLoading={poolQuery.isPending} />

      <PosterRail
        title={<>New <em>releases</em></>}
        movies={newReleasesQuery.data?.items}
        isLoading={newReleasesQuery.isPending}
        link={{ to: '/movies?sort=release_date&order=desc', label: 'See all' }}
      />
    </>
  )
}
