# Movie Reviews System: Frontend

React + TypeScript + Vite ile yazılan arayüz.

## Kurulum

```bash
cd frontend
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü + production derlemesi (`dist/`) |
| `npm run preview` | Derlenmiş sürümü yerelde açar |
| `npm run lint` | Oxlint ile kod kontrolü |

## Ortam değişkenleri

`.env.example` dosyasını `.env` adıyla kopyalayıp backend adresini yazın:

```
VITE_API_URL=http://localhost:8000
```

## Kullanılan kütüphaneler

- **React Router**: sayfa yönlendirme
- **TanStack Query**: API'den veri çekme ve önbellekleme
- **Axios**: HTTP istekleri
- **Tailwind CSS**: stil

## Ortam değişkenleri

`.env.example` dosyasını `.env` adıyla kopyalayıp backend adresini yazın:

```
VITE_API_URL=http://localhost:8000
```

## Kullanılan kütüphaneler

- **React Router**: sayfa yönlendirme
- **TanStack Query**: API'den veri çekme ve önbellekleme
- **Axios**: HTTP istekleri
- **Tailwind CSS**: stil
