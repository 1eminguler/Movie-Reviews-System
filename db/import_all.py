import json
import os
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from db import connect
from import_movies import MIN_VOTES, TV_MOVIE_ID, film_yaz
from tmdb_client import get

IDLER_DOSYASI = "film_idleri.json"
HATA_LOGU = "hatalar.log"
ILK_YIL, SON_YIL = 1900, 2026

SINIR = None   # deneme için bir sayı yaz (örneğin 200), tam çekim için None
ISCI = 4       # aynı anda atılan istek sayısı
PARTI = 100    # her seferde işlenen film sayısı


def idleri_topla():
    """Yıl yıl film kimliklerini toplar. Daha önce toplandıysa dosyadan okur."""
    if os.path.exists(IDLER_DOSYASI):
        with open(IDLER_DOSYASI, encoding="utf-8") as f:
            idler = json.load(f)
        print(f"{len(idler)} film kimliği {IDLER_DOSYASI} dosyasından okundu")
        return idler

    idler = {}
    for yil in range(ILK_YIL, SON_YIL + 1):
        sayfa = 1
        while True:
            d = get("/discover/movie", **{
                "vote_count.gte": MIN_VOTES,
                "without_genres": str(TV_MOVIE_ID),
                "include_adult": "false",
                "language": "en-US",
                "sort_by": "popularity.desc",
                "primary_release_year": yil,
                "page": sayfa,
            })
            for f in d["results"]:
                idler[f["id"]] = yil
            if sayfa >= min(d["total_pages"], 500):
                break
            sayfa += 1
        if d["total_pages"] > 500:
            print(f"UYARI: {yil} yılı 500 sayfayı aşıyor, bazı filmler eksik kalabilir")

    liste = list(idler.keys())
    with open(IDLER_DOSYASI, "w", encoding="utf-8") as f:
        json.dump(liste, f)
    print(f"{len(liste)} film kimliği toplandı ve {IDLER_DOSYASI} dosyasına kaydedildi")
    return liste


def detay_cek(film_id):
    """TMDB'den bir filmin detayını çeker. (film_id, veri, hata) döndürür."""
    try:
        m = get(
            f"/movie/{film_id}",
            language="en-US",
            append_to_response="credits,release_dates",
        )
        return film_id, m, None
    except Exception as e:
        return film_id, None, e


def main():
    idler = idleri_topla()

    with connect() as conn:
        # autocommit açık: her film kendi işlemiyle kalıcı kaydedilir
        conn.autocommit = True

        with conn.cursor() as cur:
            cur.execute("SELECT tmdb_id FROM movies")
            mevcut = {satir[0] for satir in cur.fetchall()}

        bekleyen = [i for i in idler if i not in mevcut]
        print(f"toplam {len(idler)} film | veritabanında {len(mevcut)} var "
              f"| çekilecek {len(bekleyen)}")
        if SINIR:
            bekleyen = bekleyen[:SINIR]
            print(f"SINIR={SINIR}: bu çalıştırmada sadece {len(bekleyen)} film çekilecek")

        yok_sayilan = Counter()
        basarili = hatali = 0
        baslangic = time.time()

        try:
            with open(HATA_LOGU, "a", encoding="utf-8") as log:
                for bas in range(0, len(bekleyen), PARTI):
                    parti = bekleyen[bas:bas + PARTI]

                    # 1) Grubun detaylarını paralel çek
                    with ThreadPoolExecutor(max_workers=ISCI) as ex:
                        sonuclar = list(ex.map(detay_cek, parti))

                    # 2) Sırayla veritabanına yaz
                    parti_hata = 0
                    for film_id, m, hata in sonuclar:
                        if hata is None:
                            try:
                                with conn.transaction():
                                    with conn.cursor() as cur:
                                        film_yaz(cur, m, yok_sayilan)
                                basarili += 1
                                continue
                            except Exception as e:
                                hata = e
                        parti_hata += 1
                        hatali += 1
                        log.write(f"{film_id}: {hata}\n")
                    log.flush()

                    islenen = bas + len(parti)
                    gecen = time.time() - baslangic
                    kalan_dk = gecen / islenen * (len(bekleyen) - islenen) / 60
                    print(f"  ... {islenen}/{len(bekleyen)} | hatalı: {hatali} "
                          f"| tahmini kalan: {kalan_dk:.0f} dk")

                    if parti_hata == len(parti):
                        print("\nBu gruptaki tüm filmler hata verdi (bağlantı sorunu olabilir). "
                              "Durduruluyor. Sorunu çözüp aynı komutla devam edebilirsin.")
                        break
        except KeyboardInterrupt:
            print("\nCtrl+C ile durduruldu. Aynı komutu çalıştırarak devam edebilirsin.")

        with conn.cursor() as cur:
            cur.execute(
                "SELECT (SELECT count(*) FROM movies), (SELECT count(*) FROM movie_genres), "
                "(SELECT count(*) FROM directors), (SELECT count(*) FROM movie_directors)"
            )
            sayilar = cur.fetchone()
            cur.execute(
                """
                SELECT count(*),
                       count(*) FILTER (WHERE certification IS NULL),
                       count(*) FILTER (WHERE cardinality(director_names) = 0),
                       count(*) FILTER (WHERE cardinality(genre_names) = 0),
                       count(*) FILTER (WHERE overview IS NULL),
                       count(*) FILTER (WHERE poster_path IS NULL)
                FROM movie_details
                """
            )
            eksik = cur.fetchone()

    gecen_dk = (time.time() - baslangic) / 60
    print("\n--- ÖZET ---")
    print(f"bu çalıştırmada başarılı: {basarili} | hatalı: {hatali} | süre: {gecen_dk:.1f} dk")
    print("yok sayılan yaş sınırı değerleri:", dict(yok_sayilan))
    print("tablo satırları (movies, movie_genres, directors, movie_directors):", sayilar)
    print("eksik alanlar (film, yaş_sınırı_yok, yönetmen_yok, tür_yok, özet_yok, afiş_yok):", eksik)


if __name__ == "__main__":
    main()