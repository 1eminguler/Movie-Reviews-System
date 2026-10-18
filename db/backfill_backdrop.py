from db import connect
from import_movies import MIN_VOTES, TV_MOVIE_ID
from tmdb_client import get

ILK_YIL, SON_YIL = 1900, 2026


def main():
    arka_planlar = {}  # tmdb_id -> backdrop_path

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
                if f.get("backdrop_path"):
                    arka_planlar[f["id"]] = f["backdrop_path"]
            if sayfa >= min(d["total_pages"], 500):
                break
            sayfa += 1
        if yil % 10 == 0:
            print(f"  ... {yil} yılına kadar {len(arka_planlar)} film için değer toplandı")

    print(f"{len(arka_planlar)} film için backdrop_path toplandı, veritabanına yazılıyor...")

    with connect() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                "UPDATE movies SET backdrop_path = %s WHERE tmdb_id = %s",
                [(yol, tmdb_id) for tmdb_id, yol in arka_planlar.items()],
            )
            cur.execute(
                "SELECT count(*), count(*) FILTER (WHERE backdrop_path IS NULL) FROM movies"
            )
            toplam, bos = cur.fetchone()

    print(f"\nmovies tablosunda toplam film: {toplam} | backdrop_path boş olan: {bos}")


if __name__ == "__main__":
    main()