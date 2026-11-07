import ComingSoonList from '@/app/components/ComingSoonList';
import {
  normalizeTMDbPayload,
  resolveReadableOverview,
  resolveReadableTitle,
} from '@/app/lib/romanize';

async function fetchTMDb(endpoint, params = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const query = new URLSearchParams({
    api_key: apiKey,
    include_adult: 'false',
    language: 'en-US',
    ...params,
  });

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?${query.toString()}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return normalizeTMDbPayload(await res.json());
  } catch (err) {
    console.error(`Failed fetching ${endpoint}:`, err);
    return null;
  }
}

function getTomorrowIsoDate() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split('T')[0];
}

export const metadata = {
  title: 'Baru & Populer - Stre4mit',
};

export default async function LatestPage() {
  const tomorrow = getTomorrowIsoDate();

  const [
    nowPlayingMovies,
    onAirTV,
    trendingTV,
    trendingMovies,
    upcomingMoviesEn,
    upcomingMoviesId,
    upcomingTVEn,
  ] = await Promise.all([
    fetchTMDb('movie/now_playing'),
    fetchTMDb('tv/on_the_air'),
    fetchTMDb('trending/tv/day'),
    fetchTMDb('trending/movie/day'),
    fetchTMDb('discover/movie', {
      'primary_release_date.gte': tomorrow,
      sort_by: 'popularity.desc',
      region: 'US',
    }),
    fetchTMDb('discover/movie', {
      'primary_release_date.gte': tomorrow,
      sort_by: 'popularity.desc',
      region: 'US',
      language: 'id-ID',
    }),
    fetchTMDb('discover/tv', {
      'first_air_date.gte': tomorrow,
      sort_by: 'popularity.desc',
    }),
  ]);

  const cleanList = (payload, defaultType) =>
    (payload?.results || [])
      .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
      .map((item) => ({
        ...item,
        media_type: item.media_type || defaultType,
      }));

  // Interleave fresh movies & TV shows for "Baru di Stre4mit"
  const moviesFresh = cleanList(nowPlayingMovies, 'movie').slice(0, 10);
  const tvFresh = cleanList(onAirTV, 'tv').slice(0, 10);
  const newReleases = [];
  const maxLen = Math.max(moviesFresh.length, tvFresh.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (moviesFresh[i]) newReleases.push(moviesFresh[i]);
    if (tvFresh[i]) newReleases.push(tvFresh[i]);
  }

  const topTV = cleanList(trendingTV, 'tv').slice(0, 10);
  const topMovies = cleanList(trendingMovies, 'movie').slice(0, 10);

  // Merge Indonesian synopses into upcoming movies when available
  const idMovieMap = new Map(
    (upcomingMoviesId?.results || []).map((m) => [m.id, m])
  );

  const upcomingMoviesMerged = cleanList(upcomingMoviesEn, 'movie').map((m) => {
    const idVersion = idMovieMap.get(m.id);
    return {
      ...m,
      title: resolveReadableTitle(m.title, idVersion?.title, m.original_title),
      overview: resolveReadableOverview(idVersion?.overview, m.overview),
    };
  });

  const upcomingTVMerged = cleanList(upcomingTVEn, 'tv').slice(0, 6);

  const upcomingItems = [...upcomingMoviesMerged.slice(0, 10), ...upcomingTVMerged]
    .filter((item) => item.backdrop_path || item.poster_path)
    .sort((a, b) => {
      const dateA = a.release_date || a.first_air_date || '9999-12-31';
      const dateB = b.release_date || b.first_air_date || '9999-12-31';
      return dateA.localeCompare(dateB);
    })
    .slice(0, 12);

  return (
    <ComingSoonList
      newReleases={newReleases}
      topTV={topTV}
      topMovies={topMovies}
      upcomingItems={upcomingItems}
    />
  );
}
