# Backend + API + Duygu Analizi — Mehmet'in Geliştirme Planı

> Movie Reviews System • CEN317 • Kıdemli odak: Backend, REST API, JWT, inceleme/puan mantığı, anlık ortalama, Gemini duygu analizi, backend testleri + CI.
> 9. hafta ara rapor için **Gemini ücretsiz API**; kendi LLM eğitimi ileri faz (Faz 7).

---

## 0. Kapsam ve ekip sınırları

| Kim | Sorumluluk | Seninle kesişim |
| --- | --- | --- |
| **Mehmet (sen)** | FastAPI backend, API uçları, JWT auth, inceleme+puan, anlık ortalama, Gemini sentiment, testler + CI | — |
| Zeliha | PostgreSQL + **DB şeması** + TMDB veri çekme (ingest) | Şemayı ondan al; ORM modellerini ona göre yaz. Film verisini DB'den sunarsın. |
| Emin | GitHub repo + koordinasyon + **frontend (arayüz)** | Frontend senin API'ni tüketir → **API kontratı (bölüm 4) sizin sözleşmeniz.** CORS'u sen açarsın. |

**Koordinasyon noktaları (baştan netleştir):**
1. **DB şeması** Zeliha'da → sen SQLAlchemy modellerini onun şemasına **birebir** uydurursun. Alembic migration'ı kim yönetiyor, konuş (tek elden olmalı).
2. **TMDB ingest** Zeliha'da → sen `GET /movies` ile sunarsın. Eğer ingest sana kayarsa Faz 3'teki opsiyonel TMDB client adımını aktif et.
3. **Sentiment** yorum metnine uygulanır, **puandan bağımsızdır**; 3'lü başlıyoruz (Olumlu/Nötr/Olumsuz).

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

FastAPI · SQLAlchemy · Pydantic · python-jose (JWT) · passlib[bcrypt] · httpx · **google-generativeai** (Gemini) · pytest · ruff.
Migration: Alembic (sahipliği Zeliha ile netleştir — çift migration karışıklık yaratır).

---

## 2. Çalışma kuralı

- Her adım: **Hedef → Yapılacaklar → Kabul kriteri**. Kabul sağlanmadan sonrakine geçme.
- Her adımda anlamlı commit (`feat: 4.1 review endpoint`). Kendi `feature/...` branch'inde çalış, `main`'e PR ile gir.
- `.env` asla commit'lenmez (`.gitignore`).
- Kod yazarken skill kullan: **test-driven-development**, hata çıkınca **systematic-debugging**, iş bitince **verification-before-completion**.

---

## 3. Veri sözleşmesi (Zeliha'nın şemasına göre — ilgili alanlar)

```
movies(id, tmdb_id, title, overview, release_year, poster_url, avg_rating, created_at)
users(id, username, email, password_hash, created_at)
reviews(id, movie_id, user_id,
        rating,            # 1–5, ZORUNLU
        comment,           # opsiyonel (nullable)
        sentiment_label,   # 'olumlu' | 'notr' | 'olumsuz'  (yalnızca comment varsa)
        sentiment_score,   # 0.0–1.0 güven/şiddet
        created_at)
```

**Kurallar:**
- `rating` zorunlu (1–5), `comment` opsiyonel.
- Duygu analizi **yalnızca `comment`** metnine uygulanır; `rating`'den bağımsız saklanır ve gösterilir.
- `movies.avg_rating` her yeni inceleme sonrası **anlık** güncellenir.
- TMDB yorumları alınmaz; yorumlar kendi kullanıcılarınızdan.
- **5'liye geçiş notu:** Kategori kümesini tek yerde (enum/sabit) tut; ileride `{cok_olumlu, olumlu, notr, olumsuz, cok_olumsuz}` yapmak için sadece o sabiti ve prompt'u değiştirmen yeterli olsun.

---

## 4. API kontratı (senin uçların)

| Metot | Yol | Açıklama |
| --- | --- | --- |
| POST | `/auth/register` | Kayıt |
| POST | `/auth/login` | Giriş → JWT |
| GET | `/users/me` | Token'la kullanıcı |
| GET | `/movies` | Liste (sayfalama; ileride filtre) |
| GET | `/movies/{id}` | Detay + `avg_rating` |
| POST | `/movies/{id}/reviews` | Korumalı. `rating` zorunlu, `comment` opsiyonel |
| GET | `/movies/{id}/reviews` | Film yorumları (+sentiment) |

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
- **Hedef:** Zeliha'nın PostgreSQL'ine bağlan.
- **Yapılacaklar:** `app/core/config.py` (Pydantic Settings, `.env`); `app/db/session.py` (SQLAlchemy engine + session); `DATABASE_URL` Zeliha'nın DB'sini gösterir. **CORS:** `CORSMiddleware` ile Emin'in frontend origin'ine (örn. `http://localhost:5173`) izin ver.
- **Kabul:** Backend başlarken DB bağlantı hatası yok; frontend origin'inden istek CORS'a takılmıyor.

> Commit: `chore: backend scaffold + db connection`.

---

## FAZ 1 — Modeller + Şemalar

### 1.1 — SQLAlchemy modelleri (şemaya göre)
- **Hedef:** DB tablolarıyla uyumlu ORM.
- **Yapılacaklar:** Zeliha'dan güncel şemayı al; `app/models/` altında `Movie`, `User`, `Review` modelleri şemaya **birebir**.
- **Kabul:** Bir kayıt okuma/yazma denemesi hatasız.

### 1.2 — Pydantic şemaları
- **Hedef:** İstek/yanıt tipleri.
- **Yapılacaklar:** `ReviewCreate {rating, comment?}`, `ReviewRead {..., sentiment_label, sentiment_score}`, `MovieRead`, `UserCreate/Read`. `rating` için 1–5 doğrulaması.
- **Kabul:** 6'nın üstünde/0 rating 422 veriyor.

---

## FAZ 2 — Kimlik Doğrulama (JWT)

### 2.1 — Register / Login
- **Yapılacaklar:** bcrypt (passlib) ile hash; `POST /auth/register`, `POST /auth/login` → JWT; `app/core/security.py`.
- **Kabul:** Kayıt + giriş geçerli token veriyor.

### 2.2 — Korumalı erişim
- **Yapılacaklar:** `get_current_user` bağımlılığı; `GET /users/me`.
- **Kabul:** Token'sız 401, token'lı kullanıcıyı döndürüyor.

> Commit: `feat: jwt auth`.

---

## FAZ 3 — Film Servis Uçları

### 3.1 — Film okuma uçları
- **Yapılacaklar:** `GET /movies` (sayfalama), `GET /movies/{id}` (+`avg_rating`). Veri DB'den (Zeliha ingest ediyor).
- **Kabul:** Filmler API'den dönüyor.

### 3.2 — (Opsiyonel) TMDB client — *yalnızca ingest sana kayarsa*
- **Yapılacaklar:** `app/services/tmdb_client.py` + seed script (film/tür/yönetmen çek, DB'ye yaz).
- **Kabul:** DB'de ≥50 film. *Zeliha yapıyorsa bu adımı atla.*

> Commit: `feat: movie read endpoints`.

---

## FAZ 4 — İnceleme + Puan + Anlık Ortalama

### 4.1 — İnceleme oluşturma
- **Yapılacaklar:** `POST /movies/{id}/reviews` (korumalı). `rating` zorunlu (1–5), `comment` opsiyonel.
- **Kabul:** Giriş yapan kullanıcı puan (ve varsa yorum) ekleyebiliyor.

### 4.2 — İnceleme listeleme
- **Yapılacaklar:** `GET /movies/{id}/reviews` (sentiment alanlarıyla).
- **Kabul:** Yorumlar listeleniyor.

### 4.3 — Anlık ortalama
- **Yapılacaklar:** İnceleme eklenince `movies.avg_rating` yeniden hesapla + yaz (aynı transaction içinde).
- **Kabul:** Yeni puan sonrası ortalama anında güncel.

> Commit: `feat: reviews + live avg rating`.

---

## FAZ 5 — Gemini Duygu Analizi ⭐ (ara rapor için kritik)

### 5.1 — Gemini client
- **Yapılacaklar:** `google-generativeai`, `GOOGLE_API_KEY`; `app/services/sentiment.py` içinde `analyze(text) -> {label, score}`. Aşağıdaki prompt'u kullan, yanıtı JSON parse et.
- **Kabul:** Örnek yorum için `{"label": "...", "score": ...}` dönüyor.

**Prompt (3'lü):**
```
Sen bir film yorumu duygu analizi sınıflandırıcısısın.
Verilen yorumu değerlendir ve SADECE şu JSON'u döndür:
{"label": "olumlu" | "notr" | "olumsuz", "score": 0.0-1.0}
score = etiketin güven düzeyi.
Yorum: """<COMMENT>"""
```

### 5.2 — İnceleme akışına bağla
- **Yapılacaklar:** `POST reviews` içinde `comment` varsa `analyze()` çağır, `sentiment_label` + `sentiment_score` kaydet. `comment` yoksa sentiment `null`. Gemini hata/timeout olursa **inceleme yine kaydedilsin** (sentiment `null` kalsın, sonradan yeniden denenebilsin).
- **Kabul:** Yorumlu inceleme sentiment'iyle, yorumsuz inceleme sentiment'siz kaydediliyor; puandan bağımsız.

### 5.3 — Sunum
- **Yapılacaklar:** `GET reviews` yanıtında sentiment alanları dönsün. (İsteğe bağlı: film düzeyinde olumlu/nötr/olumsuz dağılımı için ayrı uç.)
- **Kabul:** Frontend sentiment'i okuyabiliyor.

> **Sentiment provider soyutlaması (önemli):** `analyze()`'ı bir arayüz arkasına koy (örn. `SentimentProvider` → `GeminiProvider`). Böylece Faz 7'de kendi modeline geçiş tek satır konfig olur.
> Commit: `feat: gemini sentiment on reviews`.
> **Bu faz bitince senin MVP'n hazır → 9. hafta ara raporunun "mevcut durum" bölümü bu haliyle yazılır.**

---

## FAZ 6 — Test + CI

### 6.1 — Testler
- **Yapılacaklar:** pytest ile auth, inceleme ekleme, ortalama hesap, sentiment (Gemini **mock'lu**). Mocking CEN315 Test Engineering ile birebir örtüşür.
- **Kabul:** `pytest` yeşil.

**Mock örneği:**
```python
def test_review_creates_sentiment(monkeypatch, client, auth_header):
    def fake_analyze(text):
        return {"label": "olumlu", "score": 0.9}
    monkeypatch.setattr("app.services.sentiment.analyze", fake_analyze)
    r = client.post("/movies/1/reviews",
                    json={"rating": 5, "comment": "Harika film"},
                    headers=auth_header)
    assert r.status_code == 201
    assert r.json()["sentiment_label"] == "olumlu"
```

### 6.2 — CI (GitHub Actions)
- **Yapılacaklar:** `.github/workflows/ci.yml` ekle; her PR'de postgres servisi + pytest. `main`'e branch protection ile "CI yeşil olmadan merge yok".
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
        image: postgres:16
        env: { POSTGRES_USER: test, POSTGRES_PASSWORD: test, POSTGRES_DB: test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r backend/requirements.txt
      - run: ruff check backend
      - run: pytest backend -v
        env:
          DATABASE_URL: postgresql+psycopg://test:test@localhost:5432/test
```

> Commit: `ci: pytest workflow`.

---

## FAZ 7 (İLERİ — rapor sonrası) — Kendi LLM Eğitimi

> Amaç: Gemini yerine/yanında kendi **fine-tuned** duygu analizi modelin. 9. hafta için gerekmez.

- **Veri:** Etiketli film yorumu seti (IMDb 50k veya Türkçe yorum verisi); 3 sınıf (olumlu/nötr/olumsuz).
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
- **Tutarlı hata formatı:** 401/404/422 durumlarında net JSON hata döndür; Emin arayüzde buna göre durum/mesaj gösterir.
- **Lokal çalışma:** backend `:8000`, frontend ayrı port (`:5173`); Emin base URL olarak `http://localhost:8000` kullanır. Bu ikisini baştan konuşun.

---

## Kontrol noktaları (ders takvimi)

| Hafta | Senin tarafında olması gereken |
| --- | --- |
| 9. hafta | Faz 0–6 bitmiş (auth + inceleme/puan + anlık ortalama + Gemini sentiment + testler/CI) → **ara rapor** |
| 10–13 | Filtreleme/iyileştirme desteği, Faz 7 başlangıcı (opsiyonel) |
| 14. hafta | Kararlı backend + testler; Faz 7 opsiyonel → **final + sunum** |

---

## .env.example (backend)

```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/moviereviews
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
