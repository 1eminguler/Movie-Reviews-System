// TMDB tür adlarının Türkçe karşılıkları
const GENRE_MAP: Record<string, string> = {
  Action: 'Aksiyon',
  Adventure: 'Macera',
  Animation: 'Animasyon',
  Comedy: 'Komedi',
  Crime: 'Suç',
  Documentary: 'Belgesel',
  Drama: 'Dram',
  Family: 'Aile',
  Fantasy: 'Fantastik',
  History: 'Tarih',
  Horror: 'Korku',
  Music: 'Müzik',
  Mystery: 'Gizem',
  Romance: 'Romantik',
  'Science Fiction': 'Bilim Kurgu',
  'TV Movie': 'TV Filmi',
  Thriller: 'Gerilim',
  War: 'Savaş',
  Western: 'Vahşi Batı',
}

export function getGenreTurkishName(name: string): string {
  return GENRE_MAP[name] ?? name
}
