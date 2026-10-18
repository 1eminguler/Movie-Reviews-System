from db import connect
from tmdb_client import get

TV_MOVIE_ID = 10770  # TV Movie türünü almıyoruz (kararımız)


def main():
    veri = get("/genre/movie/list", language="en")
    turler = [(g["id"], g["name"]) for g in veri["genres"] if g["id"] != TV_MOVIE_ID]
    print(f"TMDB'den {len(veri['genres'])} tür geldi, TV Movie hariç {len(turler)} tür yazılacak")

    with connect() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO genres (tmdb_genre_id, name)
                VALUES (%s, %s)
                ON CONFLICT (tmdb_genre_id) DO UPDATE SET name = EXCLUDED.name
                """,
                turler,
            )
            cur.execute("SELECT count(*) FROM genres")
            print("genres tablosundaki toplam satır:", cur.fetchone()[0])


if __name__ == "__main__":
    main()