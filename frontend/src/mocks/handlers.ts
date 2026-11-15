import { delay, http, HttpResponse } from 'msw'
import { API_URL } from '../config.ts'
import type { Director, Genre, Movie, Paginated, Review, SentimentLabel, User } from '../types.ts'

// Demo modu: backend olmadan arayüzü gerçek veri örnekleriyle göstermek için.
// Veri yerel veritabanından alınmış popüler filmlerdir; duygu etiketleri örnek amaçlıdır.
interface DemoData {
  genres: Genre[]
  directors: Director[]
  movies: Movie[]
  reviews: Review[]
}

const ANALYSIS_MS = 2500
const LATENCY_MS = 250

export function createHandlers(data: DemoData) {
  const movies = data.movies.map((m) => ({ ...m }))
  const reviews = data.reviews.map((r) => ({ ...r }))
  const users: (User & { password: string })[] = [
    { id: 1, username: 'demo', email: 'demo@example.com', password: 'demo1234', created_at: new Date().toISOString() },
  ]
  const tokens = new Map<string, number>()
  let nextReviewId = Math.max(...reviews.map((r) => r.id)) + 1

  const toPublic = (u: User): User => ({ id: u.id, username: u.username, email: u.email, created_at: u.created_at })
  const url = (path: string) => `${API_URL}${path}`
  const error = (status: number, detail: string) => HttpResponse.json({ detail }, { status })

  function currentUser(request: Request) {
    const header = request.headers.get('Authorization') ?? ''
    const userId = tokens.get(header.replace(/^Bearer /, ''))
    return users.find((u) => u.id === userId)
  }

  function paginate<T>(items: T[], params: URLSearchParams): Paginated<T> | Response {
    const page = Number(params.get('page') ?? 1)
    const pageSize = Number(params.get('page_size') ?? 20)
    if (pageSize > 100) return error(422, 'page_size: en fazla 100 olmalı')
    if (page < 1 || pageSize < 1) return error(422, 'page: en az 1 olmalı')
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, page_size: pageSize }
  }

  function refreshMovie(movieId: number) {
    const movie = movies.find((m) => m.id === movieId)
    if (!movie) return
    const ratings = reviews.filter((r) => r.movie_id === movieId).map((r) => r.rating)
    movie.review_count = ratings.length
    movie.avg_rating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
      : null
  }

  // Backend'deki arka plan analizini taklit eder: metin varsa birkaç saniye sonra sonuç yazılır
  function scheduleAnalysis(review: Review) {
    if (!review.review_text) return
    const text = review.review_text
    setTimeout(() => {
      if (review.review_text !== text) return
      const label: SentimentLabel = review.rating >= 4 ? 'positive' : review.rating === 3 ? 'neutral' : 'negative'
      review.sentiment_label = label
      review.sentiment_score = 0.82
      review.sentiment_status = 'done'
    }, ANALYSIS_MS)
  }

  function applyText(review: Review, text: string | null | undefined) {
    const clean = text && text.trim() ? text : null
    review.review_text = clean
    review.sentiment_label = null
    review.sentiment_score = null
    review.sentiment_status = clean ? 'pending' : 'skipped'
  }

  const year = (m: Movie) => (m.release_date ? Number(m.release_date.slice(0, 4)) : null)

  return [
    http.all(url('/*'), async () => {
      await delay(LATENCY_MS)
    }),

    http.post(url('/auth/register'), async ({ request }) => {
      const body = (await request.json()) as { username: string; email: string; password: string }
      if (!body.username || body.username.length < 3) return error(422, 'username: en az 3 karakter olmalı')
      if (!body.password || body.password.length < 8) return error(422, 'password: en az 8 karakter olmalı')
      if (users.some((u) => u.username === body.username)) return error(409, 'Bu kullanıcı adı zaten kullanımda')
      if (users.some((u) => u.email === body.email)) return error(409, 'Bu email zaten kullanımda')
      const user = { id: users.length + 1, username: body.username, email: body.email, password: body.password, created_at: new Date().toISOString() }
      users.push(user)
      return HttpResponse.json(toPublic(user), { status: 201 })
    }),

    http.post(url('/auth/login'), async ({ request }) => {
      const form = new URLSearchParams(await request.text())
      const user = users.find((u) => u.username === form.get('username') && u.password === form.get('password'))
      if (!user) return error(401, 'Kullanıcı adı veya şifre hatalı')
      const token = crypto.randomUUID()
      tokens.set(token, user.id)
      return HttpResponse.json({ access_token: token, token_type: 'bearer' })
    }),

    http.get(url('/users/me'), ({ request }) => {
      const user = currentUser(request)
      if (!user) return error(401, 'Geçersiz veya süresi dolmuş token')
      return HttpResponse.json(toPublic(user))
    }),

    http.get(url('/genres'), () => HttpResponse.json(data.genres)),

    http.get(url('/directors'), ({ request }) => {
      const params = new URL(request.url).searchParams
      const search = (params.get('search') ?? '').toLowerCase()
      const limit = Math.min(Number(params.get('limit') ?? 20), 50)
      return HttpResponse.json(data.directors.filter((d) => d.name.toLowerCase().includes(search)).slice(0, limit))
    }),

    http.get(url('/movies'), ({ request }) => {
      const p = new URL(request.url).searchParams
      const num = (k: string) => (p.get(k) ? Number(p.get(k)) : null)
      const search = p.get('search')?.trim().toLowerCase()
      let list = movies.filter((m) => {
        const y = year(m)
        return (
          (!search || m.title.toLowerCase().includes(search)) &&
          (num('genre_id') === null || m.genre_ids.includes(num('genre_id')!)) &&
          (num('director_id') === null || m.director_ids.includes(num('director_id')!)) &&
          (num('year_min') === null || (y !== null && y >= num('year_min')!)) &&
          (num('year_max') === null || (y !== null && y <= num('year_max')!)) &&
          (num('runtime_min') === null || (m.runtime !== null && m.runtime >= num('runtime_min')!)) &&
          (num('runtime_max') === null || (m.runtime !== null && m.runtime <= num('runtime_max')!)) &&
          (!p.get('certification') || m.certification === p.get('certification')) &&
          (!p.get('language') || m.original_language === p.get('language'))
        )
      })
      const sort = p.get('sort') ?? 'avg_rating'
      const dir = p.get('order') === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        const av = a[sort as keyof Movie]
        const bv = b[sort as keyof Movie]
        if (av === null) return 1
        if (bv === null) return -1
        return (av < bv ? -1 : av > bv ? 1 : 0) * dir
      })
      const result = paginate(list, p)
      return result instanceof Response ? result : HttpResponse.json(result)
    }),

    http.get(url('/movies/:id'), ({ params }) => {
      const movie = movies.find((m) => m.id === Number(params.id))
      return movie ? HttpResponse.json(movie) : error(404, 'Film bulunamadı')
    }),

    http.get(url('/movies/:id/reviews'), ({ params, request }) => {
      const list = reviews
        .filter((r) => r.movie_id === Number(params.id))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
      const result = paginate(list, new URL(request.url).searchParams)
      return result instanceof Response ? result : HttpResponse.json(result)
    }),

    http.post(url('/movies/:id/reviews'), async ({ params, request }) => {
      const user = currentUser(request)
      if (!user) return error(401, 'Geçersiz veya süresi dolmuş token')
      const movieId = Number(params.id)
      if (!movies.some((m) => m.id === movieId)) return error(404, 'Film bulunamadı')
      if (reviews.some((r) => r.movie_id === movieId && r.user_id === user.id)) {
        return error(409, 'Bu filme zaten yorum yaptınız')
      }
      const body = (await request.json()) as { rating: number; review_text: string | null }
      if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return error(422, 'rating: en az 1, en fazla 5 olmalı')
      const now = new Date().toISOString()
      const review: Review = {
        id: nextReviewId++, movie_id: movieId, user_id: user.id, username: user.username, rating: body.rating,
        review_text: null, sentiment_label: null, sentiment_score: null, sentiment_status: 'skipped',
        created_at: now, updated_at: now,
      }
      applyText(review, body.review_text)
      reviews.push(review)
      refreshMovie(movieId)
      scheduleAnalysis(review)
      return HttpResponse.json(review, { status: 201 })
    }),

    http.get(url('/movies/:id/reviews/me'), ({ params, request }) => {
      const user = currentUser(request)
      if (!user) return error(401, 'Geçersiz veya süresi dolmuş token')
      const review = reviews.find((r) => r.movie_id === Number(params.id) && r.user_id === user.id)
      return review ? HttpResponse.json(review) : error(404, 'Yorum bulunamadı')
    }),

    http.patch(url('/movies/:id/reviews/me'), async ({ params, request }) => {
      const user = currentUser(request)
      if (!user) return error(401, 'Geçersiz veya süresi dolmuş token')
      const review = reviews.find((r) => r.movie_id === Number(params.id) && r.user_id === user.id)
      if (!review) return error(404, 'Yorum bulunamadı')
      const body = (await request.json()) as { rating?: number; review_text?: string | null }
      if (body.rating !== undefined) review.rating = body.rating
      if ('review_text' in body && body.review_text !== review.review_text) {
        applyText(review, body.review_text)
        scheduleAnalysis(review)
      }
      review.updated_at = new Date().toISOString()
      refreshMovie(review.movie_id)
      return HttpResponse.json(review)
    }),

    http.delete(url('/movies/:id/reviews/me'), ({ params, request }) => {
      const user = currentUser(request)
      if (!user) return error(401, 'Geçersiz veya süresi dolmuş token')
      const index = reviews.findIndex((r) => r.movie_id === Number(params.id) && r.user_id === user.id)
      if (index === -1) return error(404, 'Yorum bulunamadı')
      const [removed] = reviews.splice(index, 1)
      refreshMovie(removed.movie_id)
      return new HttpResponse(null, { status: 204 })
    }),

    http.get(url('/users/me/reviews'), ({ request }) => {
      const user = currentUser(request)
      if (!user) return error(401, 'Geçersiz veya süresi dolmuş token')
      const list = reviews.filter((r) => r.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at))
      const result = paginate(list, new URL(request.url).searchParams)
      return result instanceof Response ? result : HttpResponse.json(result)
    }),

    http.get(url('/movies/:id/sentiment-summary'), ({ params }) => {
      const movieId = Number(params.id)
      if (!movies.some((m) => m.id === movieId)) return error(404, 'Film bulunamadı')
      const summary = { positive: 0, neutral: 0, negative: 0, pending: 0 }
      for (const r of reviews) {
        if (r.movie_id !== movieId) continue
        if (r.sentiment_status === 'pending') summary.pending++
        else if (r.sentiment_status === 'done' && r.sentiment_label) summary[r.sentiment_label]++
      }
      return HttpResponse.json(summary)
    }),
  ]
}
