import Link from 'next/link';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import MovieCard from '../components/MovieCard';

async function searchTMDb(query, page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here' || !query) return { results: [], total_results: 0, total_pages: 0 };

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false&language=id-ID`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return { results: [], total_results: 0, total_pages: 0 };
    const data = await res.json();
    
    // Filter to only movies and TV shows with poster/backdrop
    const filtered = (data.results || []).filter(
      (item) => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path)
    );

    return {
      results: filtered,
      total_results: data.total_results || 0,
      total_pages: data.total_pages || 0,
    };
  } catch (err) {
    console.error("Search fetch error:", err);
    return { results: [], total_results: 0, total_pages: 0 };
  }
}

export default async function SearchPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const currentPage = parseInt(resolvedParams.page || '1', 10);

  const { results, total_pages } = await searchTMDb(query, currentPage);

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
              Hasil Pencarian
            </h1>
            {query && (
              <p className="text-sm text-zinc-400 mt-1">
                Menampilkan hasil untuk <span className="text-red-500 font-semibold">&ldquo;{query}&rdquo;</span>
              </p>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {results.map((item) => (
                <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {total_pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                {currentPage > 1 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-full border border-zinc-800 transition-colors duration-150 active:scale-95"
                  >
                    ← Sebelumnya
                  </Link>
                )}
                <span className="text-xs text-zinc-500 font-medium px-3">
                  Halaman {currentPage} dari {total_pages}
                </span>
                {currentPage < total_pages && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-full border border-zinc-800 transition-colors duration-150 active:scale-95"
                  >
                    Selanjutnya →
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
            <SearchIcon className="text-zinc-700 w-16 h-16 animate-pulse" />
            <h2 className="text-lg font-bold text-zinc-300">
              {query ? 'Tidak Ada Hasil' : 'Cari Sesuatu'}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {query 
                ? `Tidak ditemukan film atau TV series yang cocok dengan "${query}". Coba kata kunci lain.`
                : 'Ketik kata kunci di kotak pencarian untuk mulai mencari film atau TV series.'
              }
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
