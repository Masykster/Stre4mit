import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import MovieCard from '../components/MovieCard';

async function searchTMDb(query, page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here' || !query) return { results: [], total_results: 0, total_pages: 0 };

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false&language=id-ID`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return { results: [], total_results: 0, total_pages: 0 };
    const data = await res.json();

    // Filter to only movies and TV shows with poster/backdrop and not adult
    const filtered = (data.results || []).filter(
      (item) => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path) && !item.adult
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
    <div className="relative min-h-screen pb-20 bg-[#141414] text-zinc-100 pt-24 px-4 md:px-12">
      <div className="space-y-6">
        {/* Netflix-style subtle search context header */}
        <div className="space-y-1">
          {query ? (
            <p className="text-sm md:text-base text-zinc-400">
              Menelusuri judul terkait: <span className="text-white font-semibold">&ldquo;{query}&rdquo;</span>
            </p>
          ) : (
            <h1 className="text-xl md:text-2xl font-bold text-white">Pencarian</h1>
          )}
        </div>

        {/* Results Grid (16:9 Netflix Landscape Cards) */}
        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {results.map((item) => (
                <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {total_pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-8">
                {currentPage > 1 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                    className="px-5 py-2 bg-[#232323] hover:bg-[#2f2f2f] text-zinc-100 text-xs font-bold rounded-[4px] border border-white/10 transition-colors duration-150 active:scale-95"
                  >
                    ← Sebelumnya
                  </Link>
                )}
                <span className="text-xs text-zinc-400 font-medium px-3">
                  Halaman {currentPage} dari {total_pages}
                </span>
                {currentPage < total_pages && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                    className="px-5 py-2 bg-[#232323] hover:bg-[#2f2f2f] text-zinc-100 text-xs font-bold rounded-[4px] border border-white/10 transition-colors duration-150 active:scale-95"
                  >
                    Selanjutnya →
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
            <SearchIcon className="text-zinc-600 w-14 h-14" />
            <h2 className="text-base md:text-lg font-bold text-zinc-200">
              {query ? `Pencarian Anda untuk "${query}" tidak cocok dengan judul apa pun.` : 'Mulai Telusuri Judul'}
            </h2>
            <div className="text-xs text-zinc-400 leading-relaxed space-y-1">
              {query ? (
                <>
                  <p>Saran:</p>
                  <p>• Coba kata kunci yang berbeda atau judul bahasa Inggris/asli.</p>
                  <p>• Mencari film atau acara TV?</p>
                </>
              ) : (
                <p>Gunakan ikon kaca pembesar di pojok kanan atas untuk mencari film atau acara TV.</p>
              )}
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-white hover:bg-white/85 active:scale-95 text-black font-bold text-xs px-5 py-2.5 rounded-[4px] transition-all duration-150"
            >
              Kembali ke Beranda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
