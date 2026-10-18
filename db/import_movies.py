from collections import Counter

from db import connect
from tmdb_client import get

TV_MOVIE_ID = 10770   # TV Movie türünü almıyoruz
MIN_VOTES = 200       # en az bu kadar oy almış filmler
HEDEF_FILM = 50       # deneme çekimi: sadece 50 film

# Yaş sınırı: yalnızca bu 5 değer kabul edilir (hafiften ağıra).
# Birden fazla geçerli değer varsa en kısıtlayıcı olan seçilir.
KISITLAMA_SIRASI = ["G", "PG", "PG-13", "R", "NC-17"]


def yas_siniri(release_dates, yok_sayilan):
    """ABD kaydındaki geçerli yaş sınırlarından en kısıtlayıcıyı döndürür, yoksa None."""
    degerler = set()
    for ulke in release_dates.get("results", []):
        if ulke["iso_3166_1"] != "US":
            continue
        for rd in ulke["release_dates"]:
            c = (rd.get("certification") or "").strip()
            if not c:
                continue
            if c in KISITLAMA_SIRASI:
                degerler.add(c)
            else:
                yok_sayilan[c] += 1
    if not degerler:
        return None
    return max(degerler, key=KISITLAMA_SIRASI.index)


def film_idlerini_topla(adet):
    """Discover ile film kimliklerini toplar (tekrarsız, sırayı koruyarak)."""
    idler = []
    sayfa = 1
    while len(idler) < adet and sayfa <= 500:
        d = get("/discover/movie", **{
            "vote_count.gte": MIN_VOTES,
            "without_genres": str(TV_MOVIE_ID),
            "include_adult": "false",
            "language": "en-US",
            "sort_by": "popularity.desc",
            "page": sayfa,
        })
        idler = list(dict.fromkeys(idler + [f["id"] for f in d["results"]]))
        if sayfa >= d["total_pages"]:
            break
        sayfa += 1
    return idler[:adet]


def film_yaz(cur, m, yok_sayilan):
    """Bir filmi ve ilişkili tür/yönetmen kayıtlarını yazar."""
    baslik = (m.get("title") or m.get("original_title") or "").strip()
    if not baslik:
        raise ValueError("filmin başlığı yok")
    sertifika = yas_siniri(m.get("release_dates", {}), yok_sayilan)

    cur.execute(
        """
        INSERT INTO movies (tmdb_id, title, original_title, original_language,
                            release_date, overview, runtime, poster_path, certification)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (tmdb_id) DO UPDATE SET
          title             = EXCLUDED.title,
          original_title    = EXCLUDED.original_title,
          original_language = EXCLUDED.original_language,
          release_date      = EXCLUDED.release_date,
          overview          = EXCLUDED.overview,
          runtime           = EXCLUDED.runtime,
          poster_path       = EXCLUDED.poster_path,
          certification     = EXCLUDED.certification
        RETURNING id
        """,
        (
            m["id"],
            baslik[:255],
            (m.get("original_title") or None) and m["original_title"][:255],
            m.get("original_language") or None,
            m.get("release_date") or None,
            m.get("overview") or None,
            m.get("runtime") or None,
            m.get("poster_path") or None,
            sertifika,
        ),
    )
    movie_id = cur.fetchone()[0]

    # Türler: eskileri silip TMDB'deki güncel listeyi yaz
    cur.execute("DELETE FROM movie_genres WHERE movie_id = %s", (movie_id,))
    tur_idleri = [g["id"] for g in m.get("genres", [])]
    if tur_idleri:
        cur.execute(
            """
            INSERT INTO movie_genres (movie_id, genre_id)
            SELECT %s, id FROM genres WHERE tmdb_genre_id = ANY(%s)
            """,
            (movie_id, tur_idleri),
        )

    # Yönetmenler: kadrodan "Director" rolündekiler, kişi başına tek kayıt
    cur.execute("DELETE FROM movie_directors WHERE movie_id = %s", (movie_id,))
    yonetmenler = {}
    for kisi in m.get("credits", {}).get("crew", []):
        if kisi.get("job") == "Director" and kisi.get("name"):
            yonetmenler[kisi["id"]] = kisi["name"][:255]
    for kisi_id, ad in yonetmenler.items():
        cur.execute(
            """
            INSERT INTO directors (tmdb_person_id, name) VALUES (%s, %s)
            ON CONFLICT (tmdb_person_id) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            """,
            (kisi_id, ad),
        )
        director_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO movie_directors (movie_id, director_id) VALUES (%s, %s) "
            "ON CONFLICT DO NOTHING",
            (movie_id, director_id),
        )

    return sertifika, len(yonetmenler)


def main():
    idler = film_idlerini_topla(HEDEF_FILM)
    print(f"{len(idler)} film kimliği toplandı")

    yok_sayilan = Counter()
    basarili = hatali = sertifikali = yonetmenli = 0

    with connect() as conn:
        for sira, film_id in enumerate(idler, 1):
            try:
                m = get(
                    f"/movie/{film_id}",
                    language="en-US",
                    append_to_response="credits,release_dates",
                )
                with conn.transaction():          # her film ayrı işlem
                    with conn.cursor() as cur:
                        sertifika, yon_sayisi = film_yaz(cur, m, yok_sayilan)
                basarili += 1
                sertifikali += sertifika is not None
                yonetmenli += yon_sayisi > 0
            except Exception as e:
                hatali += 1
                print(f"  HATA film {film_id}: {e}")
            if sira % 10 == 0:
                print(f"  ... {sira}/{len(idler)}")

        with conn.cursor() as cur:
            cur.execute(
                "SELECT (SELECT count(*) FROM movies), (SELECT count(*) FROM movie_genres), "
                "(SELECT count(*) FROM directors), (SELECT count(*) FROM movie_directors)"
            )
            sayilar = cur.fetchone()

    print("\n--- ÖZET ---")
    print(f"başarılı: {basarili} | hatalı: {hatali}")
    print(f"yaş sınırı olan film: {sertifikali} | yönetmeni olan film: {yonetmenli}")
    print("yok sayılan yaş sınırı değerleri:", dict(yok_sayilan))
    print("tablo satırları (movies, movie_genres, directors, movie_directors):", sayilar)


if __name__ == "__main__":
    main()