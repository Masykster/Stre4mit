// Central registry of third-party embed players.
// Used by VideoPlayer (movie + tv) and MovieDetailClient (inline movie player)
// so the server list and URL formats are defined in exactly one place.

export const DEFAULT_SOURCE = 'vidsrc.sh';

export const VIDEO_SOURCES = [
  { value: 'vidsrc.sh', label: 'Vidsrc.sh', optionLabel: 'Server 1 (vidsrc.sh)' },
  { value: 'vidlink.pro', label: 'Vidlink.pro', optionLabel: 'Server 2 (vidlink.pro)' },
  { value: 'vidcore', label: 'Vidcore.org', optionLabel: 'Server 3 (vidcore.org)' },
  { value: 'superembed', label: 'Superembed.mov', optionLabel: 'Server 4 (superembed.mov)' },
  { value: 'anyembed', label: 'Anyembed.xyz', optionLabel: 'Server 5 (anyembed.xyz)' },
  { value: '2embed', label: '2embed.cc', optionLabel: 'Server 6 (2embed.cc)' },
  { value: 'vidsrc.to', label: 'Vidsrc.to', optionLabel: 'Server 7 (vidsrc.to)' },
  { value: 'vidfast', label: 'VidFast.vc', optionLabel: 'Server 8 (vidfast.vc)' },
  { value: 'vidsrc.link', label: 'Vidsrc.link', optionLabel: 'Server 9 (vidsrc.link)' },
  { value: 'vixsrc', label: 'VixSrc.to', optionLabel: 'Server 10 (vixsrc.to)' },
  { value: 'embedwave', label: 'EmbedWave.cc', optionLabel: 'Server 11 (embedwave.cc)' },
  { value: 'vidnest', label: 'VidNest.pro', optionLabel: 'Server 12 (vidnest.pro)' },
];

/**
 * Builds the iframe embed URL for a given source.
 * Season/episode are only required for `type === 'tv'`.
 */
export function getEmbedUrl(source, type, id, season, episode) {
  switch (source) {
    case 'vidsrc.sh':
      return type === 'tv'
        ? `https://vidsrc.sh/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.sh/embed/movie/${id}`;

    case 'vidlink.pro': {
      const base = type === 'tv'
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`;
      const theme = '?primaryColor=dc2626&secondaryColor=18181b&iconColor=dc2626&icons=vid';
      return type === 'tv' ? `${base}${theme}&nextbutton=true` : `${base}${theme}`;
    }

    case 'vidcore': // replaces Videasy, which shut down in September 2026
      return type === 'tv'
        ? `https://vidcore.org/embed/tv/${id}/${season}/${episode}`
        : `https://vidcore.org/embed/movie/${id}`;

    case 'superembed':
      return type === 'tv'
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`;

    case 'anyembed': // SmashyStream now redirects here
      return type === 'tv'
        ? `https://anyembed.xyz/embed/tmdb-tv-${id}-${season}-${episode}`
        : `https://anyembed.xyz/embed/tmdb-movie-${id}`;

    case '2embed':
      return type === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}?s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`;

    case 'vidfast':
      return type === 'tv'
        ? `https://vidfast.vc/tv/${id}/${season}/${episode}`
        : `https://vidfast.vc/movie/${id}`;

    case 'vidsrc.link':
      return type === 'tv'
        ? `https://vidsrc.link/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.link/embed/movie/${id}`;

    case 'vixsrc':
      return type === 'tv'
        ? `https://vixsrc.to/tv/${id}/${season}/${episode}`
        : `https://vixsrc.to/movie/${id}`;

    case 'embedwave':
      return type === 'tv'
        ? `https://embedwave.cc/embed/tv/${id}/${season}/${episode}`
        : `https://embedwave.cc/embed/movie/${id}`;

    case 'vidnest':
      return type === 'tv'
        ? `https://vidnest.pro/tv/${id}/${season}/${episode}`
        : `https://vidnest.pro/movie/${id}`;

    default: // vidsrc.to
      return type === 'tv'
        ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${id}`;
  }
}
