import os

import psycopg
from dotenv import load_dotenv

load_dotenv()


def connect():
    """movie_reviews veritabanına bağlanır (ayarlar .env dosyasından okunur)."""
    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "movie_reviews"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD"),
    )


if __name__ == "__main__":
    # Sadece bu dosya doğrudan çalıştırılınca devreye giren bağlantı testi
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT current_database(), count(*) FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
            )
            print(cur.fetchone())