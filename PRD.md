Product Requirement Document (PRD)

Projek: Stre4mit (Kloningan Platform Streaming Film & TV Series)

1. Ringkasan Projek (Project Overview)

Stre4mit adalah aplikasi web berbasis streaming film dan TV series yang dirancang untuk kebutuhan portofolio pribadi. Projek ini mengintegrasikan data metadata dari The Movie Database (TMDb) API dan pemutar video interaktif menggunakan Embedder API (seperti Vidsrc). Fokus utama dari projek ini adalah menyajikan antarmuka pengguna (UI) yang modern, responsif, berkinerja tinggi menggunakan Next.js (App Router), serta bebas dari gangguan iklan pop-up bawaan server pemutar video.

1.1 Tujuan Utama

Menunjukkan pemahaman mendalam tentang Next.js (App Router), Server-Side Rendering (SSR), dan Incremental Static Regeneration (ISR).

Mengintegrasikan API pihak ketiga secara aman tanpa mengekspos API Key ke sisi klien (client-side).

Menyajikan UI/UX premium yang responsif dengan Dark Mode bawaan ala platform streaming modern (Netflix, Disney+, Idlix).

Mengimplementasikan fitur ramah pengguna seperti Watchlist, History nonton terakhir, dan pencarian instan.

2. Arsitektur & Teknologi (Tech Stack)

Frontend Framework: Next.js (versi terbaru dengan App Router)

Styling: Tailwind CSS (untuk desain modern, responsif, dan utilitas cepat)

Icons: Lucide React

State Management & Persistence: React Context API + Local Storage (tanpa database eksternal untuk menjaga projek tetap ringan dan mandiri)

API Sumber Data: TMDb API (v3)

API Pemutar Video: Vidsrc.to / Vidsrc.me (via iframe sandbox)

3. Filosofi UI/UX & Design System (Netflix-Inspired)

Untuk menghasilkan kualitas visual setingkat industri, projek ini mengadopsi 4 pilar desain utama:

3.1 Minimalism & Visual Hierarchy

Latar Belakang Gelap (True Dark Mode): Menggunakan warna dasar hitam pekat (bg-zinc-950 atau bg-black) agar poster film yang penuh warna (vibrant cover art) terlihat sangat menonjol (pop).

Reduksi Gangguan visual (Clutter-Free): Menghilangkan elemen teks tak penting di beranda. Perjalanan pengguna dirancang mulus: dari mendarat di halaman utama, klik poster, langsung diarahkan ke halaman detail/putar tanpa distorsi iklan atau menu yang membingungkan.

Tipografi Kontras: Menggunakan font sans-serif modern (misal: Inter atau Geist) dengan ukuran tebal dan kontras tinggi untuk judul utama, serta teks abu-abu redup (text-zinc-400) untuk metadata pendukung (tahun, rating, durasi).

3.2 Implementasi Atomic Design

Komponen antarmuka Next.js akan dipecah secara hierarkis untuk menjamin konsistensi visual dan kemudahan perawatan kode (maintainability):

Atoms (Komponen Fundamental):

Button (tombol Play, Watchlist, Next/Prev dengan varian solid, outline, dan ghost).

Icon (wrapper Lucide Icons dengan ukuran standar).

Badge (rating penonton, kualitas HD/4K, tahun rilis).

Typography (heading standar, paragraf sinopsis).

Molecules (Gabungan Atoms):

MovieCard (menggabungkan poster, badge rating, tombol play saat di-hover, dan judul pendek).

SearchBar (kolom input teks dengan ikon pencarian dinamis).

NavItem (link navigasi dengan status aktif/tidak aktif).

Organisms (Komponen Kompleks):

MovieCarousel (slider banner utama di halaman beranda).

MovieGrid (layout responsif untuk menampilkan daftar film).

NavigationBar (header atas yang melayang/sticky dengan logo, menu navigasi, dan pencarian).

EpisodeSelector (list navigasi antar season dan episode untuk serial TV).

Templates & Pages (Struktur Layout):

MainLayout (kerangka header, konten utama, dan footer).

WatchLayout (layout khusus bioskop/theater mode).

3.3 Responsive Card System ("The Stack")

Sistem kartu modular yang sangat adaptif untuk berbagai ukuran layar (Mobile, Tablet, Desktop, hingga Smart TV):

Aspek Rasio Konsisten: Poster menggunakan rasio vertikal standar aspect-[2/3] sedangkan backdrop/banner menggunakan rasio horizontal aspect-video atau aspect-[16/9].

Sistem Grid Fleksibel: Menggunakan CSS Grid Tailwind yang responsif:

Mobile: grid-cols-2 (2 kartu per baris)

Tablet: md:grid-cols-4 (4 kartu per baris)

Desktop: lg:grid-cols-6 (6 kartu per baris)

Efek Transisi Halus (The Hover Pop-up): Saat kartu di-hover pada layar desktop, kartu akan sedikit membesar (scale-105), memunculkan bayangan lembut (shadow-2xl), dan menampilkan informasi singkat (rating & genre) di bagian bawah kartu secara instan.

3.4 Pendekatan User-Centered & Interaktif

Simulasi Hover Preview: Meniru fitur auto-play trailer Netflix dengan memicu pemutaran video trailer YouTube resmi secara otomatis (senyap/muted) ketika pengguna mengarahkan kursor (hover) ke banner utama selama lebih dari 1.5 detik.

Simulasi Personalisasi Konten: Memanfaatkan History tontonan dari LocalStorage untuk menyusun baris khusus bernama "Lanjutkan Menonton untuk [User]" di bagian paling atas halaman beranda, memberikan pengalaman personal yang adaptif sejak kunjungan pertama.

4. Fitur Utama & Kebutuhan Fungsional (Core Features)

4.1 Halaman Beranda (Homepage)

Halaman pertama yang dilihat pengguna saat membuka situs.

Hero Carousel/Banner: Menampilkan 5 film trending teratas secara otomatis berputar dengan sinopsis singkat dan tombol "Nonton Sekarang".

Kategori Grid/Slider: Baris horizontal yang dapat di-scroll (menggunakan touch swipe atau mouse drag) untuk kategori:

Sedang Tayang di Bioskop (Now Playing)

Film Populer (Popular Movies)

TV Series Populer (Popular TV Shows)

Rating Tertinggi (Top Rated)

Bilah Pencarian Instan (Instant Search): Kolom pencarian di bagian navigasi atas yang menampilkan hasil pencarian secara instan (debounced search) begitu pengguna mengetik judul film.

Filter Genre & Kategori: Halaman atau modal untuk memfilter konten berdasarkan genre (Aksi, Komedi, Drama, dll.) dan tipe (Movie / TV Show).

4.2 Halaman Detail Konten (Content Detail Page)

Menampilkan informasi lengkap mengenai satu film atau TV series spesifik (/movie/[id] atau /tv/[id]).

Metadata Lengkap: Menampilkan poster besar, backdrop image buram sebagai latar belakang, judul, tahun rilis, rating bintang, durasi, genre, dan sinopsis lengkap.

Informasi Cast & Crew: Daftar aktor/aktris utama dalam bentuk lingkaran foto kecil beserta nama karakter mereka.

Rekomendasi Terkait: Grid film sejenis di bagian bawah untuk mempertahankan retensi pengguna di situs.

Struktur Episode & Season (Khusus TV Series):

Dropdown pemilih Season (Musim).

List vertikal/grid untuk daftar Episode (dilengkapi dengan nomor episode, judul episode, dan sinopsis singkat jika tersedia).

4.3 Halaman Pemutar Video (Player Page)

Halaman inti tempat pengguna melakukan streaming video (/watch/movie/[id] atau /watch/tv/[id]/[season]/[episode]).

Iframe Player Terintegrasi: Menggunakan pemutar dari Vidsrc dengan parameter keamanan ketat (sandbox="allow-scripts allow-same-origin allow-forms") untuk memblokir iklan pop-up liar/judi yang sering muncul dari server embed.

Mode Bioskop (Theater Mode): Tombol untuk memperlebar ukuran pemutar video dan meredupkan lampu latar situs (latar belakang menjadi hitam pekat).

Tombol Navigasi Episode (Khusus TV Series): Tombol "Episode Sebelumnya" dan "Episode Selanjutnya" yang muncul di bawah player untuk memudahkan navigasi tanpa harus kembali ke halaman detail.

4.4 Fitur Personalisasi (Tanpa Login / LocalStorage)

Watchlist (Daftar Tontonan): Pengguna bisa menandai film/TV series dengan tombol "Tambah ke Watchlist". Daftar ini akan disimpan di LocalStorage dan bisa diakses di halaman khusus /watchlist.

Terakhir Ditonton (History/Continue Watching): Menyimpan progres tontonan terakhir pengguna (termasuk season dan episode terakhir yang dibuka) di halaman beranda agar pengguna bisa melanjutkan tontonan mereka dengan satu klik.

5. Kebutuhan Non-Fungsional & Optimasi Portofolio

Performa Nilai Lighthouse Tinggi: Mengoptimalkan pemuatan gambar poster film menggunakan komponen <Image /> bawaan Next.js untuk kompresi otomatis ke format WebP.

API Key Proxy (Security): Semua pemanggilan API ke TMDb dilakukan melalui folder /app/api/... (Next.js Route Handlers). Klien tidak pernah tahu API Key TMDb asli kamu.

Mobile First Design: Memastikan tombol-tombol navigasi di pemutar video berukuran minimal 44x44 piksel agar mudah ditekan di layar sentuh HP.

Pemuatan Berbayang (Skeleton Loading): Menggunakan efek shimmer skeleton screen saat data film sedang di-load dari API agar transisi terasa sangat halus dan modern.

6. Rencana Tahapan Rilis (Development Roadmap)

Tahap 1: Inisiasi Projek & Desain Global

Setup Next.js App Router dengan Tailwind CSS.

Konfigurasi variabel lingkungan (.env.local) untuk API Key TMDb.

Pembuatan layout global (Header, Footer, Sidebar navigasi jika ada, dan tema gelap/dark mode).

Tahap 2: Inisiasi Komponen Atom & Molekul

Membuat fondasi desain sistem (Atoms & Molecules seperti Button, Badge, MovieCard).

Menguji responsivitas sistem kartu (Responsive Card System) di berbagai ukuran layar.

Tahap 3: Integrasi TMDb API & Landing Page

Pembuatan Route Handler di Next.js untuk menjembatani request ke API TMDb.

Menyusun komponen Carousel Banner utama dan slider baris film di Beranda.

Mengimplementasikan fitur pencarian global.

Tahap 4: Halaman Detail & Pemilih Episode

Membuat halaman dinamis /movie/[id] dan /tv/[id].

Mendesain struktur visual informasi film dan list episode TV series yang interaktif.

Tahap 5: Integrasi Video Player & Sandbox Security

Membuat halaman /watch/... dengan komponen pemutar iframe.

Menguji ketahanan sandbox iframe untuk memastikan iklan pop-up bawaan server embed terblokir dengan sempurna dan video tetap dapat diputar tanpa kendala.

Tahap 6: LocalStorage Features & Finishing

Implementasi sistem penyimpanan lokal untuk fitur Watchlist dan Continue Watching.

Pembuatan efek animasi Skeleton Loading untuk meningkatkan UX.

Pengujian responsivitas di berbagai perangkat (HP, Tablet, Laptop).