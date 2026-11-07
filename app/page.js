import { Suspense } from 'react';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import Top10Row from './components/Top10Row';
import ContinueWatchingRow from './components/ContinueWatchingRow';
import { AlertCircle } from 'lucide-react';
import {
  normalizeMediaItem,
  normalizeTMDbPayload,
  resolveReadableOverview,
  resolveReadableTitle,
} from '@/app/lib/romanize';

async function fetchFromTMDb(endpoint, queryParams = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    return null;
  }

  const query = new URLSearchParams(queryParams);
  query.set('api_key', apiKey);
  if (!query.has('language')) {
    query.set('language', 'en-US');
  }
  const url = `https://api.themoviedb.org/3/${endpoint}?${query.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return normalizeTMDbPayload(json);
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    return null;
  }
}

// Skeletons to avoid layout shift (CLS) and display progressive loading
function HeroBannerSkeleton() {
  return (
    <div className="w-full h-[78vh] min-h-[540px] max-h-[880px] md:h-[88vh] bg-[#181818] animate-pulse flex items-end px-4 sm:px-6 md:px-12 pb-36 md:pb-44">
      <div className="space-y-4 max-w-xl w-full">
        <div className="h-14 sm:h-20 w-2/3 bg-[#242424] rounded-[4px]" />
        <div className="h-4 w-48 bg-[#242424] rounded-[4px]" />
        <div className="h-14 w-full bg-[#242424] rounded-[4px]" />
        <div className="flex gap-3 pt-1">
          <div className="h-11 w-28 bg-[#242424] rounded-[4px]" />
          <div className="h-11 w-36 bg-[#242424] rounded-[4px]" />
        </div>
      </div>
    </div>
  );
}

function MovieRowSkeleton() {
  return (
    <div className="space-y-2.5 px-4 md:px-12 animate-pulse">
      <div className="h-6 w-48 bg-[#222222] rounded-[4px]" />
      <div className="flex gap-2.5 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="w-[205px] sm:w-[235px] md:w-[260px] lg:w-[280px] flex-shrink-0 aspect-video bg-[#202020] rounded-[4px]"
          />
        ))}
      </div>
    </div>
  );
}

// Lazy components using React Suspense for server-side HTML streaming
async function LazyHeroBanner() {
  const data = await fetchFromTMDb('trending/all/day', { include_adult: 'false', language: 'en-US' });
  const rawItems =
    data?.results
      ?.filter((item) => item.backdrop_path && (item.title || item.name) && !item.adult)
      ?.slice(0, 5) || [];

  if (rawItems.length === 0) return null;

  const items = await Promise.all(
    rawItems.map(async (item) => {
      try {
        const [enDetails, idDetails] = await Promise.all([
          fetchFromTMDb(`${item.media_type}/${item.id}`, {
            append_to_response: 'images',
            language: 'en-US',
            include_image_language: 'id,en,null',
          }),
          fetchFromTMDb(`${item.media_type}/${item.id}`, {
            language: 'id-ID',
          }),
        ]);

        const logos = enDetails?.images?.logos || [];
        const logo =
          logos.find((l) => l.iso_639_1 === 'id') ||
          logos.find((l) => l.iso_639_1 === 'en') ||
          logos[0];
        const logoUrl = logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;

        const cleanTitle = resolveReadableTitle(
          item.title || item.name,
          enDetails?.title || enDetails?.name
        );

        return normalizeMediaItem({
          ...item,
          title: item.title ? cleanTitle : item.title,
          name: item.name ? cleanTitle : item.name,
          overview: resolveReadableOverview(idDetails?.overview, item.overview || enDetails?.overview),
          logoUrl,
        });
      } catch (err) {
        console.error(`Failed to fetch details for trending ${item.media_type}:`, err);
        return normalizeMediaItem(item);
      }
    })
  );

  return <HeroBanner items={items} badgeLabel="#1 di Indonesia Hari Ini" />;
}

async function LazyTop10Row() {
  const data = await fetchFromTMDb('trending/all/day', { include_adult: 'false', language: 'en-US' });
  const filtered = (data?.results || []).filter(
    (item) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path && !item.adult
  );
  if (filtered.length === 0) return null;
  return <Top10Row title="Top 10 di Indonesia Hari Ini" items={filtered} />;
}

async function LazyMovieRow({ title, endpoint, queryParams = {}, mediaTypeOverride, exploreHref }) {
  const data = await fetchFromTMDb(endpoint, { include_adult: 'false', language: 'en-US', ...queryParams });
  if (!data || !data.results || data.results.length === 0) return null;

  const filtered = data.results
    .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
    .map((item) => (mediaTypeOverride ? { ...item, media_type: mediaTypeOverride } : item));

  if (filtered.length === 0) return null;
  return <MovieRow title={title} items={filtered} exploreHref={exploreHref} />;
}

export default async function Home() {
  const apiKey = process.env.TMDB_API_KEY;
  const isKeyConfigured = apiKey && apiKey !== 'your_tmdb_api_key_here';

  if (!isKeyConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] pt-24 p-8 text-center max-w-lg mx-auto bg-[#141414] text-zinc-100">
        <AlertCircle className="text-[#E50914] w-14 h-14 mb-4 animate-pulse" />
        <h1 className="text-xl md:text-2xl font-bold mb-2">API Key Belum Dikonfigurasi</h1>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Stre4mit memerlukan TMDb API Key untuk memuat konten. Harap buka file{' '}
          <code className="bg-[#232323] px-2 py-1 rounded text-[#E50914] text-xs">.env.local</code> di root projek dan isi dengan API key Anda:
        </p>
        <pre className="bg-[#181818] p-4 rounded-md text-left text-xs font-mono text-zinc-300 w-full mb-6 select-all border border-white/10">
          TMDB_API_KEY=your_actual_tmdb_api_key_here
        </pre>
        <p className="text-zinc-500 text-xs leading-relaxed">
          Anda bisa mendapatkan API key secara gratis dengan membuat akun di{' '}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E50914] hover:underline"
          >
            themoviedb.org
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-[#141414] overflow-x-clip">
      {/* Full-bleed Netflix Billboard */}
      <Suspense fallback={<HeroBannerSkeleton />}>
        <LazyHeroBanner />
      </Suspense>

      {/* Rows Stack — overlapped onto bottom vignette of Hero Banner */}
      <div className="relative z-20 -mt-20 sm:-mt-28 md:-mt-36 space-y-8 md:space-y-11">
        {/* Continue Watching (Client-Side Storage) */}
        <ContinueWatchingRow />

        {/* Trending This Week */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyMovieRow
            title="Sedang Trending Sekarang"
            endpoint="trending/all/week"
            exploreHref="/discover?sortBy=popularity&view=grid"
          />
        </Suspense>

        {/* Iconic Top 10 Ranked Row */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyTop10Row />
        </Suspense>

        {/* Popular Movies */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyMovieRow
            title="Film Blockbuster Populer"
            endpoint="movie/popular"
            mediaTypeOverride="movie"
            exploreHref="/discover?type=movie"
          />
        </Suspense>

        {/* Popular TV Series */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyMovieRow
            title="Acara TV Populer"
            endpoint="tv/popular"
            mediaTypeOverride="tv"
            exploreHref="/discover?type=tv"
          />
        </Suspense>

        {/* Curated Anime Row */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyMovieRow
            title="Anime Jepang Pilihan"
            endpoint="discover/tv"
            queryParams={{ with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' }}
            mediaTypeOverride="tv"
            exploreHref="/discover?anime=true"
          />
        </Suspense>

        {/* Action & Adventure Row */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyMovieRow
            title="Aksi & Petualangan Memacu Adrenalin"
            endpoint="discover/movie"
            queryParams={{ with_genres: '28', sort_by: 'popularity.desc' }}
            mediaTypeOverride="movie"
            exploreHref="/discover?genre=28&genreName=Aksi&view=grid"
          />
        </Suspense>

        {/* Top Rated Movies */}
        <Suspense fallback={<MovieRowSkeleton />}>
          <LazyMovieRow
            title="Peringkat Tertinggi Kritikus"
            endpoint="movie/top_rated"
            mediaTypeOverride="movie"
            exploreHref="/discover?type=movie&view=grid"
          />
        </Suspense>
      </div>
    </div>
  );
}
