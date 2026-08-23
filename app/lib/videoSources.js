// Central registry of third-party embed players.
// Used by VideoPlayer (movie + tv) and MovieDetailClient (inline movie player)
// so the server list and URL formats are defined in exactly one place.

export const DEFAULT_SOURCE = 'vidsrc-embed.ru';

export const VIDEO_SOURCES = [
  { value: 'vidsrc-embed.ru', label: 'Vidsrc-embed.ru', optionLabel: 'Server 1 (vidsrc-embed.ru)' },
  { value: 'vidlink.pro', label: 'Vidlink.pro', optionLabel: 'Server 2 (vidlink.pro)' },
  { value: 'videasy', label: 'Videasy.net', optionLabel: 'Server 3 (videasy.net)' },
  { value: 'superembed', label: 'Superembed.mov', optionLabel: 'Server 4 (superembed.mov)' },
  { value: 'smashystream', label: 'SmashyStream', optionLabel: 'Server 5 (smashystream.com)' },
  { value: '2embed', label: '2embed.cc', optionLabel: 'Server 6 (2embed.cc)' },
  { value: 'vidsrc.to', label: 'Vidsrc.to', optionLabel: 'Server 7 (vidsrc.to)' },
];

/**
 * Builds the iframe embed URL for a given source.
 * Season/episode are only required for `type === 'tv'`.
 */
export function getEmbedUrl(source, type, id, season, episode) {
  switch (source) {
    case 'vidsrc-embed.ru':
      return type === 'tv'
        ? `https://vidsrc-embed.ru/embed/tv/${id}/${season}-${episode}`
        : `https://vidsrc-embed.ru/embed/movie/${id}`;

    case 'vidlink.pro': {
      const base = type === 'tv'
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`;
      const theme = '?primaryColor=dc2626&secondaryColor=18181b&iconColor=dc2626&icons=vid';
      return type === 'tv' ? `${base}${theme}&nextbutton=true` : `${base}${theme}`;
    }

    case 'videasy':
      return type === 'tv'
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}?color=dc2626&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true`
        : `https://player.videasy.net/movie/${id}?color=dc2626&overlay=true`;

    case 'superembed':
      return type === 'tv'
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`;

    case 'smashystream':
      return type === 'tv'
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}`;

    case '2embed':
      return type === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}?s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`;

    default: // vidsrc.to
      return type === 'tv'
        ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${id}`;
  }
}
