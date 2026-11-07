import Link from 'next/link';
import MovieCard from '@/app/components/MovieCard';
import { normalizeTMDbPayload } from '@/app/lib/romanize';

const QUICK_SEARCH_TOPICS = [
  { label: 'Anime', href: '/discover?anime=true' },
  { label: 'Drama Korea', href: '/languages?lang=ko' },
  { label: 'Film Indonesia', href: '/languages?lang=id&type=movie' },
  { label: 'Baru & Populer', href: '/latest' },
  { label: 'Aksi & Petualangan', href: '/discover?genre=28&genreName=Aksi&view=grid' },
  { label: 'Horor', href: '/discover?genre=27&genreName=Horor&view=grid' },
  { label: 'Fiksi Ilmiah', href: '/discover?genre=878&genreName=Fiksi%20Ilmiah&view=grid' },
];

async function searchTMDb(query, page = 1) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here' || !query) {
    return { results: [], total_results: 0, total_pages: 0 };
  }

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false&language=en-US`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return { results: [], total_results: 0, total_pages: 0 };
    const data = normalizeTMDbPayload(await res.json());

    const filtered = (data.results || []).filter(
      (item) =>
        (item.media_type === 'movie' || item.media_type === 'tv') &&
        (item.poster_path || item.backdrop_path) &&
        !item.adult
    );

    return {
      results: filtered,
      total_results: data.total_results || 0,
      total_pages: data.total_pages || 0,
    };
  } catch (err) {
    console.error('Search fetch error:', err);
    return { results: [], total_results: 0, total_pages: 0 };
  }
}

async function getTrendingSearches() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=en-US`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data = normalizeTMDbPayload(await res.json());
    return (data.results || [])
      .filter(
        (item) =>
          (item.media_type === 'movie' || item.media_type === 'tv') &&
          (item.backdrop_path || item.poster_path) &&
          !item.adult
      )
      .slice(0, 15);
  } catch (err) {
    console.error('Trending search fallback error:', err);
    return [];
  }
}

export default async function SearchPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = (resolvedParams.q || '').trim();
  const currentPage = parseInt(resolvedParams.page || '1', 10);

  const [{ results, total_pages }, trendingItems] = await Promise.all([
    query
      ? searchTMDb(query, currentPage)
      : Promise.resolve({ results: [], total_results: 0, total_pages: 0 }),
    !query || currentPage === 1 ? getTrendingSearches() : Promise.resolve([]),
  ]);

  // Extract distinct Netflix-style "Explore titles related to:" suggestions
  const relatedTitles = Array.from(
    new Set(
      results
        .slice(0, 7)
        .map((item) => item.title || item.name)
        .filter(Boolean)
    )
  ).slice(0, 6);

  return (
    <div className="relative min-h-screen pb-24 bg-[#141414] text-zinc-100 pt-24 px-4 md:px-12 space-y-7">
      {query ? (
        <>
          {/* Authentic Netflix "Explore titles related to:" Header Bar */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs sm:text-sm">
            <span className="text-zinc-500 font-medium">Menelusuri judul terkait:</span>
            {relatedTitles.length > 0 ? (
              relatedTitles.map((relTitle, idx) => (
                <span key={relTitle} className="inline-flex items-center gap-2.5">
                  {idx > 0 && <span className="text-zinc-600">|</span>}
                  <Link
                    href={`/search?q=${encodeURIComponent(relTitle)}`}
                    className="text-zinc-200 hover:text-[#E50914] transition-colors font-medium"
                  >
                    {relTitle}
                  </Link>
                </span>
              ))
            ) : (
              <span className="text-white font-semibold">&ldquo;{query}&rdquo;</span>
            )}
          </div>

          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {results.map((item) => (
                  <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
                ))}
              </div>

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
            <div className="space-y-10 pt-4">
              <div className="max-w-xl space-y-2 text-xs sm:text-sm text-zinc-300">
                <p className="text-sm sm:text-base font-semibold text-white">
                  Pencarian Anda untuk &ldquo;{query}&rdquo; tidak cocok dengan judul apa pun.
                </p>
                <p className="text-zinc-400">
                  Saran: Coba kata kunci lain, judul bahasa Inggris/Romaji, atau jelajahi tayangan terpopuler di bawah ini.
                </p>
              </div>

              {trendingItems.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Rekomendasi Populer untuk Anda
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {trendingItems.map((item) => (
                      <MovieCard key={`fallback-${item.media_type}-${item.id}`} item={item} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      ) : (
        /* Empty Query State: Netflix "Top Searches This Week" + Quick Category Chips */
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-white tracking-tight">
              Pencarian Terpopuler Minggu Ini
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_SEARCH_TOPICS.map((topic) => (
                <Link
                  key={topic.label}
                  href={topic.href}
                  className="px-3.5 py-1.5 rounded-full bg-[#242424] hover:bg-white hover:text-black text-xs font-bold text-zinc-200 transition-colors"
                >
                  {topic.label}
                </Link>
              ))}
            </div>
          </div>

          {trendingItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {trendingItems.map((item) => (
                <MovieCard key={`top-search-${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
