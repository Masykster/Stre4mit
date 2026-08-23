// Shared helpers for the Discover feature.
// Used by BOTH the server page (app/discover/page.js) and the client-side
// infinite scroll list (app/components/DiscoverList.js) so the query building
// logic lives in exactly one place and can never drift apart.

export const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

// Generated dynamically from the current year so the filter never goes stale.
export const YEARS = Array.from({ length: 7 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: String(year), label: String(year) };
});

/**
 * Builds the TMDb discover endpoint + query params from URL searchParams.
 * The returned URLSearchParams intentionally excludes `api_key`:
 * - Server components attach it themselves (direct TMDb fetch).
 * - Client components rely on the /api/tmdb proxy which injects it.
 *
 * @param {object} searchParams Resolved URL search params (type, genre, year,
 *   month, anime, drama, sortBy, subType).
 * @param {number|string} [page] Optional TMDb result page number.
 * @returns {{ endpoint: string, query: URLSearchParams, mediaType: 'movie'|'tv' }}
 */
export function buildDiscoverRequest(searchParams, page) {
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
  }

  // Determine sorting parameter
  let tmdbSortBy = endpoint === 'discover/tv' ? 'first_air_date.desc' : 'primary_release_date.desc';
  if (sortBy === 'popularity') {
    tmdbSortBy = 'popularity.desc';
  } else if (sortBy === 'title') {
    tmdbSortBy = endpoint === 'discover/tv' ? 'original_name.asc' : 'original_title.asc';
  }
  // sortBy === 'release_date' (or unset) keeps the date-based default above

  const query = new URLSearchParams({
    sort_by: tmdbSortBy,
    include_adult: 'false',
    language: 'id-ID',
  });
  if (page !== undefined && page !== null && page !== '') {
    query.set('page', String(page));
  }

  // Only show content that has already been released
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

  const mediaType = endpoint === 'discover/tv' ? 'tv' : 'movie';
  return { endpoint, query, mediaType };
}

/**
 * Filters adult content and stamps every item with an explicit media_type so
 * MovieCard can build correct navigation routes.
 */
export function mapDiscoverResults(results, mediaType) {
  return (results || [])
    .filter((item) => !item.adult)
    .map((item) => ({ ...item, media_type: mediaType }));
}
