# Movie Reviews System — Backend (CLAUDE.md)

Bu klasör (`backend/`) projenin **backend + API + duygu analizi** parçasıdır.
Detaylı adım adım faz planı: `backend/PLAN.md` (gerektiğinde oku).

## Tek doğru kaynak: `db/database/schema.sql`
- Şemanın sahibi **Zeliha**. Backend şemaya **uyar, şemayı değiştirmez**. Değişiklik gerekiyorsa Zeliha'ya iletilir.
- Kurallar ve örnek sorgular: `db/README.md`. Şüphede kalırsan önce bu iki dosyayı oku.
- **Alembic YOK.** Backend tablo oluşturmaz: `Base.metadata.create_all()` çağrılmaz. SQLAlchemy modelleri şemaya **birebir** uyar.

## Stack
- Python + **FastAPI**, SQLAlchemy 2.x, Pydantic
- DB sürücüsü: **psycopg 3** → `DATABASE_URL=postgresql+psycopg://...`, DB adı **`movie_reviews`**
- Auth: JWT (python-jose) + bcrypt (passlib)
- **PostgreSQL** — şema `db/database/schema.sql`, sahibi Zeliha
- Duygu analizi: **Google Gemini API** (`google-generativeai`)
- Test: pytest + ruff (testler gerçek PostgreSQL'e karşı; trigger ve view'lar SQLite'ta yok)

## Çalışma kuralları
- Çalışma klasörü: `backend/`. Kodun tamamı burada.
- Her anlamlı adımda commit (`feat: ...`, `fix: ...`, `test: ...`). Doğrudan `main`'e push YOK — `feature/...` branch + Pull Request.
- `.env` asla commit edilmez (zaten `.gitignore`'da). Tüm secret'lar `.env`'den Pydantic Settings ile okunur.
- Kod production-ready ve sade; gereksiz yorum yok.
- TDD tercih: önce test, sonra kod. Dış servisler (Gemini, TMDB) testte **mock'lanır**.

## Domain kuralları (kritik)
- **Puan (`rating`):** 1–5, zorunlu. **Yorum metni (`review_text`):** opsiyonel; **`NULL` ya da dolu metin**, asla boş/boşluktan ibaret string değil (DB CHECK reddeder). API'de gelen boş/boşluk metin `None`'a çevrilir.
- **Tek yorum kuralı:** `UNIQUE(user_id, movie_id)`. Aynı kullanıcı aynı filme ikinci kez yorum atarsa **409 Conflict**.
- **Duygu analizi YALNIZCA `review_text`'e** uygulanır ve **puandan BAĞIMSIZDIR**.
- **Sentiment etiketleri:** `positive` | `negative` | `neutral` (+ `sentiment_score` 0–1, NUMERIC(3,2)). Etiket kümesi **tek bir Enum**'da (`SentimentLabel`) tutulur; ileride 5'liye geçiş yalnızca bu Enum + prompt değişikliğiyle olmalı. `sentiment_label` ve `sentiment_score` **birlikte** dolu ya da birlikte `NULL`.
- **`sentiment_status`:** `pending` | `done` | `failed` | `skipped` (`SentimentStatus` Enum).
  - Metinsiz yorumu **trigger** otomatik `skipped` yapar; metinli yorum `pending` başlar.
  - Metin değişirse **trigger** eski sonucu siler ve `pending`'e çeker (metin silindiyse `skipped`).
  - Backend yalnızca Gemini sonucuna göre **`done`** (etiket + skor ile birlikte) veya **`failed`** yazar. `pending`/`skipped`'i backend elle yazmaz.
- **`movies.avg_rating` ve `movies.review_count` DB trigger'ı ile güncellenir. Backend bu kolonlara ASLA yazmaz.** Yorum yoksa `avg_rating = NULL`, `review_count = 0`.
- **Film listesi ve detayı `movie_details` view'ından okunur** (`genre_ids/genre_names`, `director_ids/director_names` dizileri; boşsa `{}`, `NULL` değil). Filtrelemede `EXISTS` kalıbı kullanılır (`db/README.md` → Örnek sorgular).
- `certification`: `G`, `PG`, `PG-13`, `R`, `NC-17` veya `NULL` (= belirtilmemiş).
- TMDB yorumları seed olarak DB'de var (sahte kullanıcılar, `password_hash = '!imported-no-login'` → bu hesaplarla giriş yapılamaz; login bu hash'te çökmemeli, 401 dönmeli). Yeni yorumlar kendi kullanıcılarımızdan. Film verisini `db/` (Zeliha) TMDB'den çeker, backend DB'den okur.
- Gemini çağrısı bir `SentimentProvider` arayüzü arkasında olmalı (ileride yerel modele geçiş tek config).

## API kontratı (frontend/Emin ile sözleşme — değiştirirsen haber ver)
- `POST /auth/register`, `POST /auth/login`, `GET /users/me`
- `GET /movies` (sayfalama + filtre: tür, yönetmen, başlık araması, yaş sınırı, süre; sıralama), `GET /movies/{id}`
- `GET /genres`
- `POST /movies/{id}/reviews` (rating zorunlu 1–5, `review_text` opsiyonel; ikinci yorum → 409), `GET /movies/{id}/reviews`
- **CORS:** frontend origin'ine (`http://localhost:5173`) izin ver.

## Takvim
- 9. hafta ara rapor: auth + inceleme/puan + ortalama trigger'ı doğrulaması + Gemini sentiment + testler/CI hazır olmalı.
- Kendi LLM eğitimi = ileri faz (rapor sonrası).
