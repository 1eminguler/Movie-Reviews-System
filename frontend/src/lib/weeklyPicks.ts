import type { Movie } from '../types.ts'

// ISO hafta numarasına göre deterministik tohum: seçki her pazartesi değişir
function getIsoWeekSeed(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return target.getUTCFullYear() * 100 + weekNo
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = items.slice()
  let state = seed >>> 0
  const nextRand = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Haftanın seçkileri: en az 5 yorumu, afişi ve arka planı olan filmlerden haftalık seçim
export function pickWeekly(pool: Movie[], count = 10): Movie[] {
  const eligible = pool.filter((m) => m.review_count >= 5 && m.backdrop_path && m.poster_path)
  const picks = seededShuffle(eligible, getIsoWeekSeed(new Date())).slice(0, count)
  if (picks.length < count) {
    const used = new Set(picks.map((m) => m.id))
    for (const m of pool) {
      if (picks.length >= count) break
      if (!used.has(m.id) && m.backdrop_path && m.poster_path) {
        picks.push(m)
        used.add(m.id)
      }
    }
  }
  return picks
}
