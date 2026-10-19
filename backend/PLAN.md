# Backend + API + Duygu Analizi — Mehmet'in Geliştirme Planı

> Movie Reviews System • CEN317 • Kıdemli odak: Backend, REST API, JWT, inceleme/puan mantığı, film filtreleme, Gemini duygu analizi, backend testleri + CI.
> **Tek doğru kaynak:** `db/database/schema.sql` (+ `db/README.md`). Backend şemaya uyar, şemayı değiştirmez.
> 9. hafta ara rapor için **Gemini ücretsiz API**; kendi LLM eğitimi ileri faz (Faz 7).

---

## 0. Kapsam ve ekip sınırları

| Kim | Sorumluluk | Seninle kesişim |
| --- | --- | --- |
| **Mehmet (sen)** | FastAPI backend, API uçları, JWT auth, inceleme+puan, film listeleme/filtreleme, Gemini sentiment, testler + CI | — |
| Zeliha | PostgreSQL + **DB şeması (`db/database/schema.sql`)** + trigger'lar + `movie_details` view + TMDB veri çekme (ingest) | Şema onun; ORM modellerini ona birebir uydurursun. Film verisini DB'den sunarsın. |
| Emin | GitHub repo + koordinasyon + **frontend (arayüz)** | Frontend senin API'ni tüketir → **API kontratı (bölüm 4) sizin sözleşmeniz.** CORS'u sen açarsın. |

**Koordinasyon noktaları (baştan netleştir):**
1. **DB şeması** Zeliha'da (`db/database/schema.sql`) → sen SQLAlchemy modellerini onun şemasına **birebir** uydurursun. **Alembic KULLANMIYORUZ**; backend tablo oluşturmaz (`create_all` yok). Şema değişikliği gerekirse Zeliha'ya iletilir.
2. **TMDB ingest** Zeliha'da → sen `GET /movies` ile `movie_details` view'ından sunarsın. Eğer ingest sana kayarsa Faz 3'teki opsiyonel TMDB client adımını aktif et.
3. **Sentiment** `review_text`'e uygulanır, **puandan bağımsızdır**; 3'lü başlıyoruz (`positive` / `neutral` / `negative`).
4. **Ortalama puan ve yorum sayısı** (`movies.avg_rating`, `movies.review_count`) DB trigger'ının işi; backend bu kolonlara yazmaz.

---

**Repo yapısı (klonlandı ✓):** `...\Engineering Design\Movie-Reviews-System\` altında. Bileşen bazlı kurulmuş — kişisel klasör yok, bu da "ortak `backend/`" kararımıza birebir uygun:

```
Movie-Reviews-System/
├── backend/     ← SEN (tüm kodun burada)
├── db/          ← Zeliha
├── frontend/    ← Emin
└── .gitignore · .gitattributes · README.md
```

`.gitignore` hazır ve `.env` · `venv/` · `__pycache__` · `pgdata/` · `*.sqlite`'ı zaten yok sayıyor. Üst klasördeki boş `proje` klasörü gereksiz; silebilirsin.

## 1. Teknoloji (senin tarafın)

FastAPI · SQLAlchemy 2.x · **psycopg 3** (`psycopg[binary]`) · Pydantic · python-jose (JWT) · passlib[bcrypt] · httpx · **google-generativeai** (Gemini) · pytest · ruff.
Bağlantı: `postgresql+psycopg://...`, DB adı `movie_reviews`.
Migration: **yok.** Şemanın sahibi `db/database/schema.sql` (Zeliha); backend yalnızca o şemaya uyan modeller yazar.

---

## 2. Çalışma kuralı

- Her adım: **Hedef → Yapılacaklar → Kabul kriteri**. Kabul sağlanmadan sonrakine geçme.
- Her adımda anlamlı commit (`feat: 4.1 review endpoint`). Kendi `feature/...` branch'inde çalış, `main`'e PR ile gir.
- `.env` asla commit'lenmez (`.gitignore`).
- Kod yazarken skill kullan: **test-driven-development**, hata çıkınca **systematic-debugging**, iş bitince **verification-before-completion**.

---

## 3. Veri sözleşmesi (`db/database/schema.sql` — tek doğru kaynak)

```
movies(id, tmdb_id, title, original_title, original_language,
       release_date,       # DATE
       overview, runtime,  # runtime: dakika (SMALLINT)
       poster_path, backdrop_path,   # TMDB göreli yolu, örn. /abc.jpg (NULL olabilir)
       certification,      # 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | NULL
       avg_rating,         # NUMERIC(3,2), TRIGGER yönetir; yorum yoksa NULL
       review_count,       # TRIGGER yönetir; yorum yoksa 0
       created_at)
genres(id, tmdb_genre_id, name)                    # 18 tür, İngilizce ad
directors(id, tmdb_person_id, name)
movie_genres(movie_id, genre_id)                   # PK (movie_id, genre_id)
movie_directors(movie_id, director_id)             # PK (movie_id, director_id)
users(id, username UNIQUE, email UNIQUE, password_hash, created_at)
reviews(id, movie_id, user_id,
        rating,            # 1–5, ZORUNLU
        review_text,       # NULL ya da dolu metin (boş/boşluk string DB'de reddedilir)
        sentiment_label,   # 'positive' | 'negative' | 'neutral' | NULL
        sentiment_score,   # NUMERIC(3,2), 0–1; etiketle BİRLİKTE dolu/boş
        sentiment_status,  # 'pending' | 'done' | 'failed' | 'skipped'
        created_at, updated_at,
        UNIQUE (user_id, movie_id))

VIEW movie_details     # film listesi/detayı buradan okunur; her film TEK satır
  (id, tmdb_id, title, original_title, original_language, release_date, overview,
   runtime, poster_path, backdrop_path, certification, avg_rating, review_count,
   genre_ids[], genre_names[], director_ids[], director_names[])   # boşsa {} (NULL değil)
```

**Kurallar:**
- `rating` zorunlu (1–5), `review_text` opsiyonel: **`NULL` ya da dolu metin**. API'de boş/boşluk metin `None`'a çevrilir.
- **Tek yorum:** `UNIQUE(user_id, movie_id)` → aynı kullanıcı aynı filme ikinci yorumda **409 Conflict**.
- Duygu analizi **yalnızca `review_text`**'e uygulanır; `rating`'den bağımsız saklanır ve gösterilir.
- **`sentiment_status` akışı:**
  - INSERT: metin yoksa **trigger** `skipped` yapar; metin varsa `pending` (DB default).
  - Metin değişirse **trigger** etiket/skoru siler, durumu `pending`'e çeker (metin silindiyse `skipped`).
  - Backend yalnızca Gemini sonucuna göre `done` (etiket + skor ile **aynı UPDATE'te**) veya `failed` yazar. Sentiment yazmak `updated_at`'i değiştirmez.
- **`movies.avg_rating` ve `movies.review_count` DB trigger'ı ile güncellenir. Backend bu kolonlara ASLA yazmaz** (ORM modelinde salt-okunur tutulur).
- Film listesi ve detayı **`movie_details` view'ından** okunur. Tür/yönetmen filtresi `EXISTS` kalıbıyla `movie_genres` / `movie_directors` üzerinden yapılır (`db/README.md` → Örnek sorgular).
- Seed verisi: 13.757 TMDB yorumu ve 1.373 sahte kullanıcı DB'de hazır. Sahte kullanıcıların `password_hash`'i `!imported-no-login` → giriş yapamazlar. Yeni yorumlar kendi kullanıcılarımızdan.
- **5'liye geçiş notu:** Etiket kümesini tek bir Enum'da (`SentimentLabel`) tut; ileride 5'liye geçmek için sadece o Enum'u ve prompt'u değiştirmek yeterli olsun. (DB tarafındaki CHECK de Zeliha tarafından güncellenmeli.)

---

## 4. API kontratı (senin uçların)

| Metot | Yol | Açıklama |
| --- | --- | --- |
| POST | `/auth/register` | Kayıt (username/email çakışması → 409) |
| POST | `/auth/login` | Giriş → JWT |
| GET | `/users/me` | Token'la kullanıcı |
| GET | `/movies` | Liste (`movie_details`): sayfalama + filtre (tür, yönetmen, başlık araması, yaş sınırı, süre) + sıralama |
| GET | `/movies/{id}` | Detay (`movie_details`): `avg_rating`, `review_count`, `genre_names`, `director_names`... |
| GET | `/genres` | Tür listesi (filtre seçenekleri için) |
| POST | `/movies/{id}/reviews` | Korumalı. `rating` zorunlu, `review_text` opsiyonel. Film yok → 404, ikinci yorum → **409** |
| GET | `/movies/{id}/reviews` | Film yorumları (+ `sentiment_label`, `sentiment_score`, `sentiment_status`) |

---

## FAZ 0 — Repo, iskelet, bağlantı

### 0.0 — Repo (klonlandı ✓) + branch
- **Durum:** Repo `Movie-Reviews-System/` olarak klonlandı; `main` branch'i mevcut, `backend/` klasörü hazır (boş).
- **Yapılacaklar:** `git checkout -b feature/backend-setup` ile kendi branch'ini aç.
- **Kabul:** `git branch` çıktısında `feature/backend-setup` aktif.

### 0.1 — Backend iskeleti
- **Hedef:** Çalışan boş API.
- **Yapılacaklar:** Repodaki `backend/` klasöründe venv; `fastapi`, `uvicorn`; `backend/app/main.py` → `GET /health`; `backend/requirements.txt`.
- **Kabul:** `uvicorn app.main:app --reload` çalışıyor, `/health` 200, `/docs` açılıyor.

### 0.2 — Config + DB bağlantısı
- **Hedef:** `movie_reviews` PostgreSQL veritabanına bağlan.
- **Yapılacaklar:** Lokal DB'yi `db/README.md` → Kurulum adımlarıyla kur (`schema.sql` + `seed_data.sql`). `app/core/config.py` (Pydantic Settings, `.env`); `app/db/session.py` (SQLAlchemy engine + session, sürücü **psycopg 3**); `DATABASE_URL=postgresql+psycopg://.../movie_reviews`. **`create_all` çağrılmaz.** **CORS:** `CORSMiddleware` ile Emin'in frontend origin'ine (örn. `http://localhost:5173`) izin ver.
- **Kabul:** Backend başlarken DB bağlantı hatası yok (`SELECT 1` başarılı); frontend origin'inden istek CORS'a takılmıyor.

> Commit: `chore: backend scaffold + db connection`.

---

## FAZ 1 — Modeller + Şemalar

### 1.1 — SQLAlchemy modelleri (şemaya göre)
- **Hedef:** `db/database/schema.sql` ile birebir uyumlu ORM. Tablo oluşturma yok.
- **Yapılacaklar:**
  - `app/models/` altında `Movie`, `Genre`, `Director`, `User`, `Review` + bağlantı tabloları `movie_genres`, `movie_directors`; `movie_details` view'ı için salt-okunur `MovieDetails` eşlemesi (`genre_ids/genre_names/director_ids/director_names` → `ARRAY`).
  - Kolon adları/tipleri şemayla aynı (`review_text`, `release_date`, `poster_path`, `backdrop_path`, `runtime`, `certification`, `original_title`, `original_language`...).
  - `movies.avg_rating` / `review_count` modelde **salt-okunur** (backend yazmaz); `server_default`/trigger'lı alanlar (`sentiment_status`, `created_at`, `updated_at`) DB'ye bırakılır, INSERT/UPDATE sonrası değerleri DB'den okunur.
  - `app/core/enums.py`: `SentimentLabel` (`positive`/`negative`/`neutral`) ve `SentimentStatus` (`pending`/`done`/`failed`/`skipped`) — etiket kümesinin **tek** tanımı. DB kolonları `VARCHAR` + CHECK olduğundan native PG ENUM tipi oluşturulmaz.
- **Kabul:** Seed'li DB'den film/yorum okunuyor; şema-model uyum testi (inspector ile tablo/kolon karşılaştırması) yeşil.

### 1.2 — Pydantic şemaları
- **Hedef:** İstek/yanıt tipleri.
- **Yapılacaklar:** `ReviewCreate {rating, review_text?}` (boş/boşluk metin → `None`), `ReviewRead {..., review_text, sentiment_label, sentiment_score, sentiment_status, username}`, `MovieListItem` / `MovieDetail` (`movie_details` alanları: `poster_path`, `backdrop_path`, `release_date`, `runtime`, `certification`, `original_title`, `original_language`, `avg_rating`, `review_count`, `genre_names`, `director_names`...), `GenreRead`, `UserCreate/Read`. `rating` için 1–5 doğrulaması.
- **Kabul:** 6'nın üstünde/0 rating 422 veriyor; `review_text: "   "` → `None` olarak işleniyor.

---

## FAZ 2 — Kimlik Doğrulama (JWT)

### 2.1 — Register / Login
- **Yapılacaklar:** bcrypt (passlib) ile hash; `POST /auth/register`, `POST /auth/login` → JWT; `app/core/security.py`. Username/email çakışması (`UNIQUE`) → 409. Seed kullanıcıların hash'i (`!imported-no-login`) geçerli bir bcrypt değil → doğrulama istisna fırlatmamalı, 401 dönmeli.
- **Kabul:** Kayıt + giriş geçerli token veriyor; aynı email ile ikinci kayıt 409; seed kullanıcıyla giriş denemesi 401 (500 değil).

### 2.2 — Korumalı erişim
- **Yapılacaklar:** `get_current_user` bağımlılığı; `GET /users/me`.
- **Kabul:** Token'sız 401, token'lı kullanıcıyı döndürüyor.

> Commit: `feat: jwt auth`.

---

## FAZ 3 — Film Servis Uçları

### 3.1 — Film okuma uçları
- **Yapılacaklar:** `GET /movies` (sayfalama), `GET /movies/{id}`. İkisi de **`movie_details` view'ından** okur (türler/yönetmenler dizi olarak gelir, ek JOIN gerekmez). Varsayılan sıralama: `avg_rating DESC NULLS LAST, review_count DESC`.
- **Kabul:** Filmler `genre_names`, `director_names` dizileriyle dönüyor; olmayan film 404.

### 3.2 — Tür / yönetmen filtresi + `GET /genres`
- **Yapılacaklar:**
  - `GET /genres` → `genres` tablosundan `{id, name}` listesi (ada göre sıralı).
  - `GET /movies` filtreleri: `genre_ids` (çoklu, "herhangi biri" mantığı), `director_id`, `q` (başlıkta `ILIKE`, `pg_trgm` indeksli), `certification` (çoklu; "tümü" seçiliyse `NULL` olanlar da gelir), `runtime_min/max`, `original_language`; `sort` (`rating`, `release_date`, `title`).
  - Tür/yönetmen filtresi **`EXISTS`** ile `movie_genres` / `movie_directors` üzerinden (aynı film tekrar etmez, indeks kullanılır) — bkz. `db/README.md` örnek sorgular.
- **Kabul:** Tür + yaş sınırı + süre birlikte filtreleniyor, çok türlü film listede bir kez çıkıyor; `GET /genres` 18 tür döndürüyor.

### 3.3 — (Opsiyonel) TMDB client — *yalnızca ingest sana kayarsa*
- **Yapılacaklar:** `app/services/tmdb_client.py` + seed script (film/tür/yönetmen çek, DB'ye yaz).
- **Kabul:** DB'de ≥50 film. *Zeliha yapıyorsa bu adımı atla.*

> Commit: `feat: movie read endpoints + filters + genres`.

---

## FAZ 4 — İnceleme + Puan (+ ortalama trigger'ı doğrulaması)

### 4.1 — İnceleme oluşturma
- **Yapılacaklar:** `POST /movies/{id}/reviews` (korumalı). `rating` zorunlu (1–5), `review_text` opsiyonel (`NULL` ya da dolu metin). INSERT'te yalnızca `movie_id, user_id, rating, review_text` yazılır; `sentiment_status` DB'ye bırakılır (trigger metinsizse `skipped` yapar). Film yok → 404. `UNIQUE(user_id, movie_id)` ihlali (`IntegrityError`) yakalanır → **409 Conflict**.
- **Kabul:** Giriş yapan kullanıcı puan (ve varsa yorum) ekleyebiliyor; metinsiz yorum `skipped`, metinli `pending` dönüyor; aynı filme ikinci yorum 409.

### 4.2 — İnceleme listeleme
- **Yapılacaklar:** `GET /movies/{id}/reviews` (kullanıcı adı + sentiment alanları + `sentiment_status`, `created_at DESC`, sayfalama).
- **Kabul:** Yorumlar listeleniyor.

### 4.3 — Ortalama trigger'ının doğru çalıştığını test et
- **Yapılacaklar:** Backend `movies.avg_rating` / `review_count`'a **yazmaz**; trigger'ın davranışını entegrasyon testiyle doğrula: yorum ekle → `review_count` +1 ve `avg_rating` doğru (2 ondalık); puan güncelle → ortalama değişir; yorum sil → değerler geri hesaplanır; son yorum silinince `avg_rating = NULL`, `review_count = 0`. Yorum ekleme yanıtından sonra `GET /movies/{id}` güncel değeri döndürmeli.
- **Kabul:** Trigger testleri yeşil; kod tabanında bu iki kolona yazan satır yok.

> Commit: `feat: reviews + rating trigger tests`.

---

## FAZ 5 — Gemini Duygu Analizi ⭐ (ara rapor için kritik)

### 5.1 — Gemini client
- **Yapılacaklar:** `google-generativeai`, `GOOGLE_API_KEY`; `app/services/sentiment.py` içinde `analyze(text) -> {label: SentimentLabel, score}`. Aşağıdaki prompt'u kullan, yanıtı JSON parse et; etiket `SentimentLabel`'a çevrilemiyorsa veya skor 0–1 dışındaysa hata say. Skor 2 ondalığa yuvarlanır (NUMERIC(3,2)). Prompt'taki etiket listesi `SentimentLabel`'dan üretilir (elle yazılmaz). Uzun yorumlar gönderilmeden önce kısaltılabilir; DB'deki metin değiştirilmez.
- **Kabul:** Örnek yorum için `{"label": "positive", "score": 0.92}` gibi bir sonuç dönüyor.

**Prompt (3'lü):**
```
Sen bir film yorumu duygu analizi sınıflandırıcısısın.
Verilen yorumu değerlendir ve SADECE şu JSON'u döndür:
{"label": "positive" | "neutral" | "negative", "score": 0.0-1.0}
score = etiketin güven düzeyi.
Yorum: """<REVIEW_TEXT>"""
```

### 5.2 — İnceleme akışına bağla
- **Yapılacaklar:** `POST reviews` sonrası `sentiment_status = 'pending'` ise (yani `review_text` doluysa) `analyze()` çağır:
  - Başarılı → `sentiment_label`, `sentiment_score`, `sentiment_status = 'done'` **tek UPDATE'te** yazılır (DB CHECK'leri bunu zorunlu kılar).
  - Gemini hata/timeout/parse hatası → `sentiment_status = 'failed'`; **inceleme yine kaydedilmiş kalır**, sonradan yeniden denenebilir.
  - `review_text` yoksa Gemini çağrılmaz; durum trigger tarafından zaten `skipped`.
  - Backend `pending` / `skipped` değerlerini elle yazmaz (trigger'ın işi).
- **Kabul:** Yorumlu inceleme `done` + etiket/skorla, Gemini hatasında `failed` ile, yorumsuz inceleme `skipped` ile kaydediliyor; puandan bağımsız.

### 5.3 — Sunum
- **Yapılacaklar:** `GET reviews` yanıtında `sentiment_label`, `sentiment_score`, `sentiment_status` dönsün (frontend `pending`/`failed`/`skipped` için uygun durum gösterir). (İsteğe bağlı: film düzeyinde positive/neutral/negative dağılımı için ayrı uç.)
- **Kabul:** Frontend sentiment'i okuyabiliyor.

### 5.4 — (Opsiyonel, MVP'ye dahil değil) Bekleyen yorumlar için toplu işleyici
- **Yapılacaklar:** Seed'deki 13.757 yorum `pending` durumda. `pending` (ve isteğe bağlı `failed`) yorumları `created_at` sırasıyla (kısmi indeks `idx_reviews_pending_sentiment`) alıp `analyze()`'dan geçiren bir script/komut. Tüm yorumları tek seferde işlemez:
  - `--limit N` (varsayılan **200**): bir çalıştırmada en fazla N yorum işlenir.
  - `--movie-id ID`: yalnızca o filmin bekleyen yorumları işlenir.
  - **Rate limit:** istekler arasında bekleme (süre config'ten, Gemini ücretsiz kotasına göre).
  - **429 gelince:** script durur (o yorum `failed` yazılmaz, `pending` kalır); sonraki çalıştırma kaldığı yerden devam eder. İlerleme ayrıca tutulmaz, `sentiment_status` zaten kaldığı yeri gösterir.
- **Kabul:** `--limit` ve `--movie-id` çalışıyor; 429'da script `pending` yorumlara dokunmadan duruyor, tekrar çalıştırınca işlenmemiş yorumlardan devam ediyor (mock'lu testle).
- **Not:** TMDB'den gelen seed yorumlarının kalıcılığı Zeliha ile netleşecek.

> **Sentiment provider soyutlaması (önemli):** `analyze()`'ı bir arayüz arkasına koy (örn. `SentimentProvider` → `GeminiProvider`). Böylece Faz 7'de kendi modeline geçiş tek satır konfig olur.
> Commit: `feat: gemini sentiment on reviews`.
> **Bu faz bitince senin MVP'n hazır → 9. hafta ara raporunun "mevcut durum" bölümü bu haliyle yazılır.**

---

## FAZ 6 — Test + CI

### 6.1 — Testler
- **Yapılacaklar:** pytest ile auth, inceleme ekleme (409 dahil), filtreler, ortalama trigger'ı, `sentiment_status` geçişleri, sentiment (Gemini **mock'lu**). Testler gerçek PostgreSQL'e karşı çalışır (trigger/view SQLite'ta yok); test DB'si `db/database/schema.sql` ile kurulur, her test transaction içinde çalışıp geri alınır. Mocking CEN315 Test Engineering ile birebir örtüşür.
- **Kabul:** `pytest` yeşil.

**Mock örneği:**
```python
def test_review_creates_sentiment(monkeypatch, client, auth_header):
    def fake_analyze(text):
        return {"label": SentimentLabel.POSITIVE, "score": 0.9}
    monkeypatch.setattr("app.services.sentiment.analyze", fake_analyze)
    r = client.post("/movies/1/reviews",
                    json={"rating": 5, "review_text": "Great movie"},
                    headers=auth_header)
    assert r.status_code == 201
    assert r.json()["sentiment_label"] == "positive"
    assert r.json()["sentiment_status"] == "done"
```

### 6.2 — CI (GitHub Actions)
- **Yapılacaklar:** `.github/workflows/ci.yml` ekle; her PR'de postgres servisi + `db/database/schema.sql` yükleme + pytest. `main`'e branch protection ile "CI yeşil olmadan merge yok".
- **Kabul:** PR açınca testler otomatik çalışıyor.

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18
        env: { POSTGRES_USER: test, POSTGRES_PASSWORD: test, POSTGRES_DB: movie_reviews }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: psql -h localhost -U test -d movie_reviews -v ON_ERROR_STOP=1 -f db/database/schema.sql
        env: { PGPASSWORD: test }
      - run: pip install -r backend/requirements.txt
      - run: ruff check backend
      - run: pytest backend -v
        env:
          DATABASE_URL: postgresql+psycopg://test:test@localhost:5432/movie_reviews
```

> Commit: `ci: pytest workflow`.

---

## FAZ 7 (İLERİ — rapor sonrası) — Kendi LLM Eğitimi

> Amaç: Gemini yerine/yanında kendi **fine-tuned** duygu analizi modelin. 9. hafta için gerekmez.

- **Veri:** Etiketli film yorumu seti (IMDb 50k veya Türkçe yorum verisi); 3 sınıf (`positive`/`neutral`/`negative`, `SentimentLabel` ile aynı küme). DB'deki yorumlar İngilizce.
- **Model:** HuggingFace transformer fine-tune — İngilizce için DistilBERT, **Türkçe yorumlar için BERTurk** (`dbmdz/bert-base-turkish-cased`).
- **Eğitim:** `transformers` + `datasets`; train/val ayrımı, accuracy/F1 raporla.
- **Servisleştirme:** Modeli Faz 5'teki `SentimentProvider` arkasına `LocalProvider` olarak koy → config ile Gemini ↔ yerel geçiş.
- **Rapor:** Final raporunda "geliştirilebilir yönler" + yöntem/sonuç olarak yaz.

---

## Frontend entegrasyonu (Emin ile)

Emin arayüzü yapacak ve senin API'ni tüketecek. Senin tarafında tutman gerekenler:

- **API kontratı = sözleşme.** Bölüm 4'teki uçlar ve bölüm 1.2/3'teki yanıt şekilleri Emin için sabittir; değiştirmen gerekirse ona önceden haber ver.
- **CORS:** FastAPI'de `CORSMiddleware` ile frontend origin'ine izin (Faz 0.2). Açılmazsa tarayıcı istekleri bloklanır — en sık yaşanan entegrasyon hatası budur.
- **JWT akışı:** `login` token döndürür → Emin token'ı saklar ve `Authorization: Bearer <token>` header'ıyla gönderir. Korumalı uçlar (inceleme ekleme vb.) bunu bekler.
- **OpenAPI `/docs`:** Swagger arayüzü Emin için hazır referanstır; uçları ve şemaları oradan görür, ayrı doküman yazmana gerek kalmaz.
- **Tutarlı hata formatı:** 401/404/409/422 durumlarında net JSON hata döndür; Emin arayüzde buna göre durum/mesaj gösterir (409 = "bu filme zaten yorum yaptınız" / "kullanıcı adı ya da email kullanımda").
- **Görseller:** `poster_path` / `backdrop_path` göreli yoldur; tam adres `https://image.tmdb.org/t/p/w500<path>`. `NULL` olabilir → yer tutucu görsel.
- **Lokal çalışma:** backend `:8000`, frontend ayrı port (`:5173`); Emin base URL olarak `http://localhost:8000` kullanır. Bu ikisini baştan konuşun.

---

## Kontrol noktaları (ders takvimi)

| Hafta | Senin tarafında olması gereken |
| --- | --- |
| 9. hafta | Faz 0–6 bitmiş (auth + film filtreleri + inceleme/puan + ortalama trigger'ı doğrulaması + Gemini sentiment + testler/CI) → **ara rapor** |
| 10–13 | Filtreleme/iyileştirme desteği, Faz 7 başlangıcı (opsiyonel) |
| 14. hafta | Kararlı backend + testler; Faz 7 opsiyonel → **final + sunum** |

---

## .env.example (backend)

```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/movie_reviews
SECRET_KEY=degistir-bunu
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_API_KEY=buraya-gemini-key
# TMDB_API_KEY=... (yalnızca ingest sana kalırsa)
```

## Ek: Git akışı (repo klonlandı ✓)

Repo yerinde: `...\Engineering Design\Movie-Reviews-System\`. Bundan sonraki döngü:

```bash
cd "...\Engineering Design\Movie-Reviews-System"
git checkout -b feature/backend-setup     # kendi branch'in
# backend/ içinde çalış
git add .
git commit -m "feat: ..."
git push -u origin feature/backend-setup
# GitHub'da Pull Request aç → arkadaşların incelesin → main'e merge
```
Not: Doğrudan `main`'e push yok; her iş kendi branch'inde + PR. `.env` zaten `.gitignore`'da — güvenle kullan.
