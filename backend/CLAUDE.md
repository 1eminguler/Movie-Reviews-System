# Movie Reviews System — Backend (CLAUDE.md)

Bu klasör (`backend/`) projenin **backend + API + duygu analizi** parçasıdır.
Detaylı adım adım faz planı: `backend/PLAN.md` (gerektiğinde oku).

## Stack
- Python + **FastAPI**, SQLAlchemy, Pydantic
- Auth: JWT (python-jose) + bcrypt (passlib)
- **PostgreSQL** — şema `db/` altında, sahibi Zeliha
- Duygu analizi: **Google Gemini API** (`google-generativeai`)
- Test: pytest + ruff

## Çalışma kuralları
- Çalışma klasörü: `backend/`. Kodun tamamı burada.
- Her anlamlı adımda commit (`feat: ...`, `fix: ...`, `test: ...`). Doğrudan `main`'e push YOK — `feature/...` branch + Pull Request.
- `.env` asla commit edilmez (zaten `.gitignore`'da). Tüm secret'lar `.env`'den Pydantic Settings ile okunur.
- Kod production-ready ve sade; gereksiz yorum yok.
- TDD tercih: önce test, sonra kod. Dış servisler (Gemini, TMDB) testte **mock'lanır**.

## Domain kuralları (kritik)
- **Puan:** 1–5, zorunlu. **Yorum:** opsiyonel.
- **Duygu analizi YALNIZCA yorum metnine** uygulanır ve **puandan BAĞIMSIZDIR**.
- Sentiment etiketleri: 3'lü → `olumlu` | `notr` | `olumsuz` (+ 0.0–1.0 score). İleride 5'liye geçilebilir, bu yüzden etiket kümesi **tek bir sabit/enum**'da tutulmalı.
- `movies.avg_rating` her yeni inceleme sonrası **anlık** güncellenir.
- TMDB yorumları ALINMAZ; yorumlar kendi kullanıcılardan. Film verisini `db/` (Zeliha) TMDB'den çeker, backend DB'den okur.
- Gemini çağrısı bir `SentimentProvider` arayüzü arkasında olmalı (ileride yerel modele geçiş tek config).

## API kontratı (frontend/Emin ile sözleşme — değiştirirsen haber ver)
- `POST /auth/register`, `POST /auth/login`, `GET /users/me`
- `GET /movies`, `GET /movies/{id}`
- `POST /movies/{id}/reviews` (rating zorunlu 1–5, comment opsiyonel), `GET /movies/{id}/reviews`
- **CORS:** frontend origin'ine (`http://localhost:5173`) izin ver.

## Takvim
- 9. hafta ara rapor: auth + inceleme/puan + anlık ortalama + Gemini sentiment + testler/CI hazır olmalı.
- Kendi LLM eğitimi = ileri faz (rapor sonrası).
