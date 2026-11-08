// Veri tipleri db/database/schema.sql ile birebir uyumludur.
// Alan adları veritabanındaki kolon adlarıyla aynı tutulur.

// ---------------------------------------------------------------------
// Sabit değer kümeleri (veritabanındaki CHECK kurallarıyla aynı)
// ---------------------------------------------------------------------

// ABD yaş sınıflandırması, hafiften ağıra sıralı
export const CERTIFICATIONS = ['G', 'PG', 'PG-13', 'R', 'NC-17'] as const
export type Certification = (typeof CERTIFICATIONS)[number]

export const SENTIMENT_LABELS = ['positive', 'neutral', 'negative'] as const
export type SentimentLabel = (typeof SENTIMENT_LABELS)[number]

// pending: analiz bekliyor | done: sonuç var | failed: analiz hata verdi | skipped: yorum metni yok
export const SENTIMENT_STATUSES = ['pending', 'done', 'failed', 'skipped'] as const
export type SentimentStatus = (typeof SENTIMENT_STATUSES)[number]

export const RATING_MIN = 1
export const RATING_MAX = 5

// ---------------------------------------------------------------------
// Tablolar
// ---------------------------------------------------------------------

// genres: 18 tür, adlar İngilizce gelir
export interface Genre {
  id: number
  tmdb_genre_id: number
  name: string
}

// directors
export interface Director {
  id: number
  tmdb_person_id: number
  name: string
}

// movie_details view'ı: bir film = bir satır, türler ve yönetmenler dizi olarak gelir.
// genre_ids / genre_names ve director_ids / director_names aynı sıradadır.
// Yönetmeni ya da türü olmayan filmde diziler boş gelir ([]), null gelmez.
export interface Movie {
  id: number
  tmdb_id: number
  title: string
  original_title: string | null
  original_language: string | null // ISO kodu: 'en', 'fr', 'ja'... (Kantonca için TMDB 'cn' kullanır)
  release_date: string | null // 'YYYY-MM-DD'
  overview: string | null
  runtime: number | null // dakika
  poster_path: string | null // TMDB göreli yolu, örn. '/abc123.jpg'
  backdrop_path: string | null
  certification: Certification | null // null = belirtilmemiş
  avg_rating: number | null // 1.00-5.00, yorum yoksa null (trigger yönetir)
  review_count: number
  genre_ids: number[]
  genre_names: string[]
  director_ids: number[]
  director_names: string[]
}

// users: password_hash API'den asla dönmez
export interface User {
  id: number
  username: string
  email: string
  created_at: string // ISO tarih-saat
}

// reviews
export interface Review {
  id: number
  movie_id: number
  user_id: number
  username: string // API yanıtında users tablosundan eklenir
  rating: number // 1-5
  review_text: string | null
  sentiment_label: SentimentLabel | null
  sentiment_score: number | null // 0-1 arası güven skoru
  sentiment_status: SentimentStatus
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------
// İstek gövdeleri
// ---------------------------------------------------------------------

// Metin yoksa boş string değil null gönderilir (veritabanı boş metni reddeder)
export interface ReviewCreate {
  rating: number
  review_text: string | null
}

export type ReviewUpdate = Partial<ReviewCreate>

export interface RegisterRequest {
  username: string // en fazla 50 karakter
  email: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
}

// ---------------------------------------------------------------------
// Film listesi filtreleri ve sayfalama
// ---------------------------------------------------------------------

export const MOVIE_SORTS = [
  'avg_rating',
  'review_count',
  'release_date',
  'title',
] as const
export type MovieSort = (typeof MOVIE_SORTS)[number]

export interface MovieFilters {
  search?: string
  genre_id?: number
  director_id?: number
  year_min?: number
  year_max?: number
  runtime_min?: number
  runtime_max?: number
  certification?: Certification
  language?: string
  sort?: MovieSort
  order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// FastAPI hata yanıtı
export interface ApiError {
  detail: string
}
