import hashlib
import math
import re
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from db import connect
from import_movies import MIN_VOTES, TV_MOVIE_ID
from tmdb_client import get

REVIEW_LIMIT = 5000  # en çok oy alan 5000 film
ISCI = 4             # aynı anda atılan istek sayısı
PARTI = 100          # her seferde işlenen film sayısı
HATA_LOGU = "hatalar_yorum.log"
# Gerçek bir hash değil: bu hesaplarla giriş yapılamaz
YER_TUTUCU_PAROLA = "!imported-no-login"


def en_cok_oy_alanlar(adet):
    """En çok oy alan filmlerin TMDB kimliklerini (tekrarsız) döndürür."""
    idler, sayfa = {}, 1
    while len(idler) < adet and sayfa <= 500:
        d = get("/discover/movie", **{
            "vote_count.gte": MIN_VOTES,
            "without_genres": str(TV_MOVIE_ID),
            "include_adult": "false",
            "language": "en-US",
            "sort_by": "vote_count.desc",
            "page": sayfa,
        })
        for f in d["results"]:
            idler[f["id"]] = True
        if sayfa >= d["total_pages"]:
            break
        sayfa += 1
    return list(idler)[:adet]


def puan_cevir(puan):
    """TMDB'nin 0-10 puanını 1-5'e çevirir. Puan yoksa None döner."""
    if puan is None:
        return None
    return min(5, max(1, math.ceil(float(puan) / 2)))


def kullanici_alanlari(yorum):
    """Yorum yazarından (kullanıcı adı, üretilmiş e-posta) üretir."""
    det = yorum.get("author_details") or {}
    ad = (det.get("username") or yorum.get("author") or "").strip()
    if not ad:
        return None
    ad = ad[:50]
    slug = re.sub(r"[^a-z0-9]+", "-", ad.lower()).strip("-")[:30] or "user"
    ozet = hashlib.md5(ad.encode("utf-8")).hexdigest()[:8]
    return ad, f"{slug}.{ozet}@example.com"


def yorum_cek(film_id):
    """TMDB'den bir filmin yorumlarının ilk sayfasını çeker."""
    try:
        d = get(f"/movie/{film_id}/reviews", language="en-US", page=1)
        return film_id, d.get("results", []), None
    except Exception as e:
        return film_id, None, e


def film_yorumlarini_yaz(cur, movie_id, yorumlar, sayac):
    """Bir filmin yorumlarını ve yazarlarını veritabanına yazar."""
    for y in yorumlar:
        metin = (y.get("content") or "").replace("\x00", "").strip()
        puan = puan_cevir((y.get("author_details") or {}).get("rating"))
        kul = kullanici_alanlari(y)

        if not metin:
            sayac["metinsiz"] += 1
            continue
        if puan is None:
            sayac["puansiz"] += 1
            continue
        if kul is None:
            sayac["yazarsiz"] += 1
            continue

        ad, eposta = kul
        cur.execute(
            """
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
            ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
            RETURNING id
            """,
            (ad, eposta, YER_TUTUCU_PAROLA),
        )
        user_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO reviews (movie_id, user_id, rating, review_text, created_at, updated_at)
            VALUES (%s, %s, %s, %s,
                    COALESCE(%s::timestamptz, now()),
                    COALESCE(%s::timestamptz, %s::timestamptz, now()))
            ON CONFLICT (user_id, movie_id) DO NOTHING
            """,
            (movie_id, user_id, puan, metin,
             y.get("created_at"), y.get("updated_at"), y.get("created_at")),
        )
        sayac["eklenen" if cur.rowcount == 1 else "zaten_vardi"] += 1


def main():
    with connect() as conn:
        conn.autocommit = True  # her film kendi işlemiyle kalıcı kaydedilir

        with conn.cursor() as cur:
            cur.execute("SELECT tmdb_id, id FROM movies")
            film_haritasi = dict(cur.fetchall())  # tmdb_id -> bizim id
            cur.execute("SELECT DISTINCT movie_id FROM reviews")
            yorumlu = {s[0] for s in cur.fetchall()}

        idler = [i for i in en_cok_oy_alanlar(REVIEW_LIMIT) if i in film_haritasi]
        bekleyen = [i for i in idler if film_haritasi[i] not in yorumlu]
        print(f"hedef {len(idler)} film | zaten yorumu olan {len(idler) - len(bekleyen)} "
              f"| işlenecek {len(bekleyen)}")

        sayac = Counter()
        baslangic = time.time()

        try:
            with open(HATA_LOGU, "a", encoding="utf-8") as log:
                for bas in range(0, len(bekleyen), PARTI):
                    parti = bekleyen[bas:bas + PARTI]

                    # 1) Yorumları paralel çek
                    with ThreadPoolExecutor(max_workers=ISCI) as ex:
                        sonuclar = list(ex.map(yorum_cek, parti))

                    # 2) Sırayla veritabanına yaz (her film ayrı işlem)
                    parti_hata = 0
                    for film_id, yorumlar, hata in sonuclar:
                        if hata is None:
                            try:
                                yerel = Counter()
                                with conn.transaction():
                                    with conn.cursor() as cur:
                                        film_yorumlarini_yaz(
                                            cur, film_haritasi[film_id], yorumlar, yerel
                                        )
                                sayac.update(yerel)
                                sayac["islenen_film"] += 1
                                if yorumlar:
                                    sayac["yorumu_olan_film"] += 1
                                continue
                            except Exception as e:
                                hata = e
                        parti_hata += 1
                        sayac["hatali_film"] += 1
                        log.write(f"{film_id}: {hata}\n")
                    log.flush()

                    islenen = bas + len(parti)
                    gecen = time.time() - baslangic
                    kalan_dk = gecen / islenen * (len(bekleyen) - islenen) / 60
                    print(f"  ... {islenen}/{len(bekleyen)} film | eklenen yorum: "
                          f"{sayac['eklenen']} | hatalı film: {sayac['hatali_film']} "
                          f"| tahmini kalan: {kalan_dk:.0f} dk")

                    if parti_hata == len(parti):
                        print("\nBu gruptaki tüm filmler hata verdi (bağlantı sorunu olabilir). "
                              "Durduruluyor. Sorunu çözüp aynı komutla devam edebilirsin.")
                        break
        except KeyboardInterrupt:
            print("\nCtrl+C ile durduruldu. Aynı komutu çalıştırarak devam edebilirsin.")

        with conn.cursor() as cur:
            cur.execute(
                "SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM reviews), "
                "(SELECT count(DISTINCT movie_id) FROM reviews), "
                "(SELECT count(*) FROM movies WHERE avg_rating IS NOT NULL)"
            )
            kullanici, yorum, yorumlu_film, ortalamali_film = cur.fetchone()
            cur.execute("SELECT sentiment_status, count(*) FROM reviews GROUP BY 1 ORDER BY 1")
            durumlar = dict(cur.fetchall())

    gecen_dk = (time.time() - baslangic) / 60
    print("\n--- ÖZET ---")
    print(f"süre: {gecen_dk:.1f} dk | işlenen film: {sayac['islenen_film']} "
          f"| yorumu olan film: {sayac['yorumu_olan_film']} | hatalı film: {sayac['hatali_film']}")
    print(f"eklenen yorum: {sayac['eklenen']} | zaten vardı: {sayac['zaten_vardi']}")
    print(f"atlanan yorum -> puansız: {sayac['puansiz']}, metinsiz: {sayac['metinsiz']}, "
          f"yazarsız: {sayac['yazarsiz']}")
    print(f"veritabanında -> kullanıcı: {kullanici} | yorum: {yorum} "
          f"| yorumlu film: {yorumlu_film} | ortalaması olan film: {ortalamali_film}")
    print("yorum duygu durumları:", durumlar)


if __name__ == "__main__":
    main()