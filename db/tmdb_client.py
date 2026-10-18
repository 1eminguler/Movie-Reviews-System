import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("TMDB_TOKEN")
if not TOKEN:
    raise SystemExit("TMDB_TOKEN bulunamadı. .env dosyasını kontrol et.")

BASE = "https://api.themoviedb.org/3"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "accept": "application/json"}


def get(path, **params):
    """TMDB'ye GET isteği atar. Bağlantı/sunucu hatasında 5 kez yeniden dener."""
    for deneme in range(5):
        bekleme = 2 ** deneme  # 1, 2, 4, 8, 16 saniye
        try:
            r = requests.get(BASE + path, headers=HEADERS, params=params, timeout=30)
            if r.status_code == 429 or r.status_code >= 500:
                print(f"  sunucu yanıtı {r.status_code}, {bekleme} sn sonra tekrar denenecek")
                time.sleep(bekleme)
                continue
            r.raise_for_status()  # 400, 401, 404 gibi hatalarda durur
            time.sleep(0.2)  # TMDB'yi yormamak için küçük bekleme
            return r.json()
        except (requests.ConnectionError, requests.Timeout):
            print(f"  bağlantı hatası, {bekleme} sn sonra tekrar denenecek ({deneme + 1}/5)")
            time.sleep(bekleme)
    raise RuntimeError(f"{path} 5 denemede de başarısız oldu")


if __name__ == "__main__":
    # Sadece bu dosya doğrudan çalıştırılınca devreye giren hızlı bağlantı testi
    veri = get("/genre/movie/list", language="en")
    print("Bağlantı tamam, tür sayısı:", len(veri["genres"]))