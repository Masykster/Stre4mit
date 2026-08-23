import DiscoverList from '../components/DiscoverList';
import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';
import { buildDiscoverRequest, mapDiscoverResults, MONTHS } from '../lib/discover';

async function getDiscoverData(searchParams) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];

  // Shared query builder keeps this in sync with client-side pagination
  const { endpoint, query, mediaType } = buildDiscoverRequest(searchParams);

  // Server-side fetch hits TMDb directly, so the API key is attached here
  // (client requests go through /api/tmdb which injects the key instead).
  const authorizedQuery = new URLSearchParams(query);
  authorizedQuery.set('api_key', apiKey);

  const url = `https://api.themoviedb.org/3/${endpoint}?${authorizedQuery.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();

    // Explicitly set media_type on items so MovieCard handles navigation routes correctly
    return mapDiscoverResults(data.results, mediaType);
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
      const monthName = MONTHS[parseInt(month) - 1]?.label || "";
      suffix = ` (${monthName} ${year})`;
    } else {
      suffix = ` (${year})`;
    }
  } else if (month) {
    const monthName = MONTHS[parseInt(month) - 1]?.label || "";
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
            <h2 className="text-lg font-bold text-zinc-300">Konten Tidak Ditemukan</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
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
