import { Suspense } from 'react';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import ContinueWatchingRow from './components/ContinueWatchingRow';
import { AlertCircle } from 'lucide-react';

async function fetchFromTMDb(endpoint, queryParams = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    return null;
  }
  
  const query = new URLSearchParams(queryParams);
  query.set('api_key', apiKey);
  const url = `https://api.themoviedb.org/3/${endpoint}?${query.toString()}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    return null;
  }
}

// Skeletons to avoid layout shift (CLS) and display progressive loading
function HeroBannerSkeleton() {
  return (
    <div className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-zinc-950 animate-pulse flex items-end p-6 md:p-12 border-b border-zinc-900">
      <div className="space-y-4 max-w-2xl w-full">
        <div className="h-4 w-20 bg-zinc-900 rounded"></div>
        <div className="h-10 sm:h-16 w-3/4 bg-zinc-900 rounded"></div>
        <div className="h-16 w-full bg-zinc-900 rounded"></div>
        <div className="flex gap-3">
          <div className="h-11 w-32 bg-zinc-900 rounded-full"></div>
          <div className="h-11 w-24 bg-zinc-900 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

function MovieRowSkeleton() {
  return (
    <div className="space-y-3 px-4 md:px-8 animate-pulse">
      <div className="h-6 w-48 bg-zinc-900 rounded"></div>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-[140px] sm:w-[170px] md:w-[190px] flex-shrink-0 aspect-[2/3] bg-zinc-900 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

// Lazy components using React Suspense for server-side HTML streaming
async function LazyHeroBanner() {
  const data = await fetchFromTMDb('trending/all/day');
  const items = data?.results
    ?.filter(item => item.backdrop_path && (item.title || item.name))
    ?.slice(0, 5) || [];

  if (items.length === 0) return null;
  return <HeroBanner items={items} />;
}

async function LazyMovieRow({ title, endpoint, queryParams = {} }) {
  const data = await fetchFromTMDb(endpoint, queryParams);
  if (!data || !data.results || data.results.length === 0) return null;
  return <MovieRow title={title} items={data.results} />;
}

export default async function Home() {
  const apiKey = process.env.TMDB_API_KEY;
  const isKeyConfigured = apiKey && apiKey !== 'your_tmdb_api_key_here';

  if (!isKeyConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-lg mx-auto bg-black text-zinc-100">
        <AlertCircle className="text-red-600 w-14 h-14 mb-4 animate-pulse" />
        <h1 className="text-xl md:text-2xl font-bold mb-2">API Key Belum Dikonfigurasi</h1>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Stre4mit memerlukan TMDb API Key untuk memuat konten. Harap buka file <code className="bg-zinc-900 px-2 py-1 rounded text-red-500 text-xs">.env.local</code> di root projek and isi dengan API key Anda:
        </p>
        <pre className="bg-zinc-900 p-4 rounded-lg text-left text-xs font-mono text-zinc-300 w-full mb-6 select-all border border-zinc-800">
          TMDB_API_KEY=your_actual_tmdb_api_key_here
        </pre>
        <p className="text-zinc-500 text-xs leading-relaxed">
          Anda bisa mendapatkan API key secara gratis dengan membuat akun di <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">themoviedb.org</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-16 space-y-10 bg-black">
      {/* Hero Carousel */}
      <Suspense fallback={<HeroBannerSkeleton />}>
        <LazyHeroBanner />
      </Suspense>

      {/* Continue Watching (Client-Side Storage) */}
      <ContinueWatchingRow />

      {/* Now Playing Row */}
      <Suspense fallback={<MovieRowSkeleton />}>
        <LazyMovieRow title="Sedang Trending" endpoint="movie/now_playing" queryParams={{ region: 'ID' }} />
      </Suspense>

      {/* Popular Movies Row */}
      <Suspense fallback={<MovieRowSkeleton />}>
        <LazyMovieRow title="Film Populer" endpoint="movie/popular" />
      </Suspense>

      {/* Popular TV Shows Row */}
      <Suspense fallback={<MovieRowSkeleton />}>
        <LazyMovieRow title="TV Series Populer" endpoint="tv/popular" />
      </Suspense>

      {/* Top Rated Movies Row */}
      <Suspense fallback={<MovieRowSkeleton />}>
        <LazyMovieRow title="Rating Tertinggi" endpoint="movie/top_rated" />
      </Suspense>
    </div>
  );
}
