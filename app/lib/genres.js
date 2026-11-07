// Static TMDb Genre registry (Movie + TV IDs) localized into Bahasa Indonesia.
// Allows cards and hover previews to display genre tags without extra API calls.

export const GENRE_MAP = {
  28: 'Aksi',
  12: 'Petualangan',
  16: 'Animasi',
  35: 'Komedi',
  80: 'Kriminal',
  99: 'Dokumenter',
  18: 'Drama',
  10751: 'Keluarga',
  14: 'Fantasi',
  36: 'Sejarah',
  27: 'Horor',
  10402: 'Musik',
  9648: 'Misteri',
  10749: 'Romantis',
  878: 'Sci-Fi',
  10770: 'Film TV',
  53: 'Thriller',
  10752: 'Perang',
  37: 'Barat',
  // TV-specific TMDb genre IDs
  10759: 'Aksi & Petualangan',
  10762: 'Anak-Anak',
  10763: 'Berita',
  10764: 'Realitas',
  10765: 'Sci-Fi & Fantasi',
  10766: 'Sinetron',
  10767: 'Bincang-Bincang',
  10768: 'Perang & Politik',
};

export const DISCOVER_GENRES = [
  { id: 28, tvId: 10759, name: 'Aksi' },
  { id: 12, tvId: 10759, name: 'Petualangan' },
  { id: 16, tvId: 16, name: 'Animasi' },
  { id: 35, tvId: 35, name: 'Komedi' },
  { id: 80, tvId: 80, name: 'Kriminal' },
  { id: 99, tvId: 99, name: 'Dokumenter' },
  { id: 18, tvId: 18, name: 'Drama' },
  { id: 10751, tvId: 10751, name: 'Keluarga' },
  { id: 14, tvId: 10765, name: 'Fantasi' },
  { id: 27, tvId: 9648, name: 'Horor' },
  { id: 9648, tvId: 9648, name: 'Misteri' },
  { id: 10749, tvId: 10749, name: 'Romantis' },
  { id: 878, tvId: 10765, name: 'Sci-Fi' },
  { id: 53, tvId: 80, name: 'Thriller' },
];

/**
 * Extracts localized genre names from either `item.genre_ids` or `item.genres`.
 */
export function getGenreNames(item, limit = 3) {
  if (!item) return [];

  if (Array.isArray(item.genre_ids) && item.genre_ids.length > 0) {
    return item.genre_ids
      .map((id) => GENRE_MAP[id])
      .filter(Boolean)
      .slice(0, limit);
  }

  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres
      .map((g) => GENRE_MAP[g.id] || g.name)
      .filter(Boolean)
      .slice(0, limit);
  }

  return [];
}

/**
 * Computes a Netflix-style Match Percentage (68% - 99%) from TMDb vote_average.
 */
export function getMatchScore(voteAverage) {
  const num = Number(voteAverage);
  if (!num || Number.isNaN(num) || num <= 0) return null;
  return Math.min(99, Math.max(68, Math.round(num * 10 + 12)));
}

/**
 * Estimates an Indonesian maturity rating badge (SU / 13+ / 17+) from genre cues.
 */
export function getMaturityBadge(item) {
  if (!item) return '13+';
  if (item.adult) return '18+';

  const ids = Array.isArray(item.genre_ids)
    ? item.genre_ids
    : Array.isArray(item.genres)
    ? item.genres.map((g) => g.id)
    : [];

  if (ids.includes(27) || ids.includes(80) || ids.includes(53) || ids.includes(10752) || ids.includes(10768)) {
    return '17+';
  }
  if (ids.includes(10762) || ids.includes(10751)) {
    return 'SU';
  }
  return '13+';
}
