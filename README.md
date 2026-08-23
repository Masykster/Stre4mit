# STRE4MIT

Kloningan antarmuka platform streaming film & TV series (gaya Netflix) yang dibangun dengan **Next.js App Router** dan terintegrasi penuh dengan [TMDb (The Movie Database) API](https://www.themoviedb.org/). Tanpa iklan, responsif, dan mendukung bahasa Indonesia.

## Fitur

- **Beranda dinamis** — hero banner karosel dengan pratinjau trailer otomatis saat hover, baris konten trending/populer/top rating, dan seksi "Lanjutkan Menonton"
- **Pencarian instan** — dropdown hasil langsung di navbar (debounce + abort request) serta halaman pencarian lengkap dengan paginasi
- **Discover** — filter berdasarkan tipe (Film/TV), genre, Anime, Drama, tahun, bulan, dan urutan; dilengkapi infinite scroll
- **Detail Film & TV** — sinopsis, pemeran, rekomendasi, logo judul resolusi tinggi, dan selector musim/episode untuk TV
- **Watchlist & Riwayat** — tersimpan di `localStorage` melalui React Context, tanpa perlu akun
- **Multi-server player** — 7 sumber embed yang bisa dipilih, mode bioskop, layar penuh, dan navigasi episode sebelumnya/selanjutnya

## Teknologi

| Teknologi | Keterangan |
|---|---|
| [Next.js](https://nextjs.org) 16 | App Router, Server Components, Route Handlers |
| React 19 | Client components untuk interaktivitas |
| Tailwind CSS v4 | Styling utility-first |
| lucide-react | Ikon |

## Menjalankan Proyek

1. Install dependencies:

```bash
npm install
```

2. Konfigurasi API key TMDb — salin file contoh lalu isi dengan API key Anda:

```bash
copy .env.local.example .env.local
```

```env
TMDB_API_KEY=your_actual_tmdb_api_key_here
```

API key gratis bisa didapatkan dengan membuat akun di [themoviedb.org](https://www.themoviedb.org/settings/api).

3. Jalankan server pengembangan:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan build produksi |
| `npm run lint` | ESLint |

## Struktur Proyek

```
app/
├── api/tmdb/[...path]/route.js  # Proxy API TMDb (menyembunyikan API key dari klien)
├── lib/
│   ├── discover.js              # Logika query discover bersama + konstanta bulan/tahun
│   └── videoSources.js          # Registry server embed & generator URL
├── context/AppContext.js        # State global watchlist + riwayat (localStorage)
├── hooks/useDragScroll.js       # Drag-scroll dengan momentum untuk baris konten
├── components/                  # Komponen UI (banner, kartu, player, dll.)
└── ...                          # Rute: /, /discover, /search, /movie, /tv, /watch, /watchlist
```

## Disclaimer

Proyek ini dibuat untuk keperluan edukasi demonstrasi frontend. Metadata bersumber dari TMDb, sedangkan pemutaran video menggunakan embed penyedia pihak ketiga — aplikasi ini tidak menyimpan atau men-streaming media apa pun secara langsung.

