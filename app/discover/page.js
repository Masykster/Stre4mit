import DiscoverList from '../components/DiscoverList';
import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';

async function getDiscoverData(searchParams) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];

  const { type, genre, year, month, anime, drama, sortBy, subType } = searchParams;
  let endpoint = 'discover/movie';
  
  if (type === 'tv') {
    endpoint = 'discover/tv';
  } else if (type === 'movie') {
    endpoint = 'discover/movie';
  } else if (anime === 'true') {
    endpoint = subType === 'movie' ? 'discover/movie' : 'discover/tv';
  } else if (drama === 'true') {
    endpoint = subType === 'tv' ? 'discover/tv' : 'discover/movie';
  } else if (genre) {
    endpoint = 'discover/movie';
  }

  // Determine sorting parameter
  let tmdbSortBy = 'primary_release_date.desc';
  if (endpoint === 'discover/tv') {
    tmdbSortBy = 'first_air_date.desc';
  }
  
  if (sortBy === 'popularity') {
    tmdbSortBy = 'popularity.desc';
  } else if (sortBy === 'title') {
    tmdbSortBy = endpoint === 'discover/tv' ? 'original_name.asc' : 'original_title.asc';
  } else if (sortBy === 'release_date') {
    tmdbSortBy = endpoint === 'discover/tv' ? 'first_air_date.desc' : 'primary_release_date.desc';
  }

  const query = new URLSearchParams({
    api_key: apiKey,
    sort_by: tmdbSortBy,
    include_adult: 'false',
    language: 'id-ID',
  });

  const today = new Date().toISOString().split('T')[0];

  if (endpoint === 'discover/tv') {
    query.set('first_air_date.lte', today);
  } else {
    query.set('primary_release_date.lte', today);
  }

  if (anime === 'true') {
    query.set('with_genres', '16'); // Animation
    query.set('with_original_language', 'ja'); // Japanese language (commonly Anime)
  } else if (drama === 'true') {
    query.set('with_genres', '18'); // Drama
  } else if (genre) {
    query.set('with_genres', genre);
  }

  // Date Filtering by Year and Month
  if (month) {
    const yearVal = year || new Date().getFullYear();
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${yearVal}-${monthStr}-01`;
    const lastDay = new Date(parseInt(yearVal), parseInt(monthStr), 0).getDate();
    const endDate = `${yearVal}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    
    if (endpoint === 'discover/tv') {
      query.set('first_air_date.gte', startDate);
      query.set('first_air_date.lte', endDate);
    } else {
      query.set('primary_release_date.gte', startDate);
      query.set('primary_release_date.lte', endDate);
    }
  } else if (year) {
    if (endpoint === 'discover/tv') {
      query.set('first_air_date_year', year);
    } else {
      query.set('primary_release_year', year);
    }
  }

  const url = `https://api.themoviedb.org/3/${endpoint}?${query.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    
    // Explicitly set media_type on items so MovieCard handles navigation routes correctly
    const items = (data.results || []).filter(item => !item.adult);
    return items.map(item => ({
      ...item,
      media_type: endpoint === 'discover/tv' ? 'tv' : 'movie'
    }));
  } catch (err) {
    console.error("Discover fetch error:", err);
    return [];
  }
}

export default async function DiscoverPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const items = await getDiscoverData(resolvedSearchParams);

  const { type, genreName, year, month, anime, drama, subType } = resolvedSearchParams;
  
  // Resolve page header title with dynamic filters summary
  let pageTitle = "Temukan Konten";
  let suffix = "";
  
  if (year) {
    if (month) {
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const monthName = monthNames[parseInt(month) - 1] || "";
      suffix = ` (${monthName} ${year})`;
    } else {
      suffix = ` (${year})`;
    }
  } else if (month) {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const monthName = monthNames[parseInt(month) - 1] || "";
    suffix = ` (${monthName})`;
  }

  if (anime === 'true') {
    if (subType === 'movie') {
      pageTitle = `Anime Movie${suffix}`;
    } else if (subType === 'tv') {
      pageTitle = `Anime Series${suffix}`;
    } else {
      pageTitle = `Anime${suffix}`;
    }
  } else if (drama === 'true') {
    if (subType === 'movie') {
      pageTitle = `Film Drama${suffix}`;
    } else if (subType === 'tv') {
      pageTitle = `Drama Series${suffix}`;
    } else {
      pageTitle = `Drama${suffix}`;
    }
  } else if (genreName) {
    pageTitle = `Genre: ${genreName}${suffix}`;
  } else if (type === 'movie') {
    pageTitle = `Film${suffix}`;
  } else if (type === 'tv') {
    pageTitle = `TV Series${suffix}`;
  } else if (year || month) {
    pageTitle = `Rilis${suffix}`;
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
          </div>
        </div>

        {/* Results Grid with Infinite Scroll */}
        {items.length > 0 ? (
          <DiscoverList 
            key={JSON.stringify(resolvedSearchParams)} 
            initialItems={items} 
            searchParams={resolvedSearchParams} 
          />
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
