import MovieCard from '../components/MovieCard';
import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';

async function getDiscoverData(searchParams) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];

  const { type, genre, year, anime, drama } = searchParams;
  let endpoint = 'discover/movie';
  const query = new URLSearchParams({
    api_key: apiKey,
    sort_by: 'popularity.desc',
    include_adult: 'false',
    language: 'id-ID',
  });

  if (type === 'tv') {
    endpoint = 'discover/tv';
  }

  if (anime === 'true') {
    endpoint = 'discover/tv';
    query.set('with_genres', '16'); // Animation
    query.set('with_original_language', 'ja'); // Japanese language (commonly Anime)
  } else if (drama === 'true') {
    endpoint = 'discover/movie';
    query.set('with_genres', '18'); // Drama
  } else {
    if (genre) {
      query.set('with_genres', genre);
      // Certain genres might exist only in tv or only in movies, or we default to movie
    }
    if (year) {
      if (endpoint === 'discover/tv') {
        query.set('first_air_date_year', year);
      } else {
        query.set('primary_release_year', year);
      }
    }
  }

  const url = `https://api.themoviedb.org/3/${endpoint}?${query.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    
    // Explicitly set media_type on items so MovieCard handles navigation routes correctly
    const items = data.results || [];
    return items.map(item => ({
      ...item,
      media_type: type || (endpoint === 'discover/tv' ? 'tv' : 'movie')
    }));
  } catch (err) {
    console.error("Discover fetch error:", err);
    return [];
  }
}

export default async function DiscoverPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const items = await getDiscoverData(resolvedSearchParams);

  const { type, genreName, year, anime, drama } = resolvedSearchParams;
  
  // Resolve page header title
  let pageTitle = "Temukan Konten";
  if (anime === 'true') {
    pageTitle = "Anime Terpopuler";
  } else if (drama === 'true') {
    pageTitle = "Film Drama Pilihan";
  } else if (genreName) {
    pageTitle = `Genre: ${genreName}`;
  } else if (year) {
    pageTitle = `Rilis Tahun ${year}`;
  } else if (type === 'movie') {
    pageTitle = "Daftar Film Populer";
  } else if (type === 'tv') {
    pageTitle = "Daftar TV Series Populer";
  }

  return (
    <div className="relative min-h-screen pb-16 bg-black text-zinc-100 pt-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="text-zinc-400 hover:text-zinc-100 p-2.5 rounded-full hover:bg-zinc-900 transition-colors duration-150 active:scale-95"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Menampilkan {items.length} hasil terpopuler dari database TMDb
            </p>
          </div>
        </div>

        {/* Results Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {items.map((item) => (
              <MovieCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
            <Film className="text-zinc-700 w-16 h-16 animate-pulse" />
            <h2 className="text-lg font-bold text-zinc-305">Konten Tidak Ditemukan</h2>
            <p className="text-xs text-zinc-455 leading-relaxed">
              Maaf, tidak ada hasil yang cocok untuk filter ini. Silakan kembali ke halaman utama untuk menelusuri konten menarik lainnya.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs px-6 py-2.5 rounded-full transition-all duration-150"
            >
              Kembali ke Beranda
            </Link>
          </div>
        )}
        
      </div>
    </div>
  );
}
