import { Suspense } from 'react';
import HeroBanner from './HeroBanner';
import MovieRow from './MovieRow';
import Top10Row from './Top10Row';
import {
  normalizeMediaItem,
  normalizeTMDbPayload,
  resolveReadableOverview,
  resolveReadableTitle,
} from '@/app/lib/romanize';

async function fetchTMDb(endpoint, queryParams = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const query = new URLSearchParams({
    include_adult: 'false',
    language: 'en-US',
    ...queryParams,
  });
  query.set('api_key', apiKey);

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?${query.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return normalizeTMDbPayload(json);
  } catch (err) {
    console.error(`DiscoverBrowseView error (${endpoint}):`, err);
    return null;
  }
}

function getCategoryConfig(searchParams) {
  if (searchParams.anime === 'true') {
    return {
      heroEndpoint: 'discover/tv',
      heroParams: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' },
      mediaType: 'tv',
      badgeLabel: '#1 di Kategori Anime Hari Ini',
      top10Title: 'Top 10 Anime Terpopuler',
      rows: [
        {
          title: 'Serial Anime Sedang Hangat',
          endpoint: 'discover/tv',
          params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' },
          mediaType: 'tv',
          exploreHref: '/discover?anime=true&subType=tv&sortBy=popularity&view=grid',
        },
        {
          title: 'Film Layar Lebar Anime',
          endpoint: 'discover/movie',
          params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' },
          mediaType: 'movie',
          exploreHref: '/discover?anime=true&subType=movie&sortBy=popularity&view=grid',
        },
        {
          title: 'Anime Aksi & Petualangan Fantasi',
          endpoint: 'discover/tv',
          params: { with_genres: '16,10759', with_original_language: 'ja', sort_by: 'vote_count.desc' },
          mediaType: 'tv',
          exploreHref: '/discover?anime=true&view=grid',
        },
        {
          title: 'Rilis Anime Terbaru',
          endpoint: 'discover/tv',
          params: {
            with_genres: '16',
            with_original_language: 'ja',
            sort_by: 'first_air_date.desc',
            'vote_count.gte': '5',
          },
          mediaType: 'tv',
          exploreHref: '/discover?anime=true&sortBy=release_date&view=grid',
        },
      ],
    };
  }

  if (searchParams.drama === 'true') {
    return {
      heroEndpoint: 'discover/tv',
      heroParams: { with_genres: '18', with_original_language: 'ko', sort_by: 'popularity.desc' },
      mediaType: 'tv',
      badgeLabel: '#1 di Kategori Drama Hari Ini',
      top10Title: 'Top 10 Serial Drama Pilihan',
      rows: [
        {
          title: 'Drama Korea & Asia Terpopuler',
          endpoint: 'discover/tv',
          params: { with_genres: '18', with_original_language: 'ko', sort_by: 'popularity.desc' },
          mediaType: 'tv',
          exploreHref: '/discover?drama=true&subType=tv&sortBy=popularity&view=grid',
        },
        {
          title: 'Film Drama Menyentuh Hati',
          endpoint: 'discover/movie',
          params: { with_genres: '18', sort_by: 'popularity.desc' },
          mediaType: 'movie',
          exploreHref: '/discover?drama=true&subType=movie&sortBy=popularity&view=grid',
        },
        {
          title: 'Drama Romantis Pilihan',
          endpoint: 'discover/movie',
          params: { with_genres: '18,10749', sort_by: 'popularity.desc' },
          mediaType: 'movie',
          exploreHref: '/discover?genre=10749&genreName=Romantis&view=grid',
        },
        {
          title: 'Serial Drama Peringkat Tertinggi',
          endpoint: 'discover/tv',
          params: { with_genres: '18', sort_by: 'vote_average.desc', 'vote_count.gte': '300' },
          mediaType: 'tv',
          exploreHref: '/discover?drama=true&subType=tv&view=grid',
        },
      ],
    };
  }

  if (searchParams.type === 'tv') {
    return {
      heroEndpoint: 'trending/tv/day',
      heroParams: {},
      mediaType: 'tv',
      badgeLabel: '#1 di Acara TV Hari Ini',
      top10Title: 'Top 10 Acara TV di Indonesia Hari Ini',
      rows: [
        {
          title: 'Acara TV Sedang Populer',
          endpoint: 'tv/popular',
          params: {},
          mediaType: 'tv',
          exploreHref: '/discover?type=tv&sortBy=popularity&view=grid',
        },
        {
          title: 'Serial Aksi & Petualangan',
          endpoint: 'discover/tv',
          params: { with_genres: '10759', sort_by: 'popularity.desc' },
          mediaType: 'tv',
          exploreHref: '/discover?type=tv&genre=10759&genreName=Aksi&view=grid',
        },
        {
          title: 'Sci-Fi, Fantasi & Misteri',
          endpoint: 'discover/tv',
          params: { with_genres: '10765', sort_by: 'popularity.desc' },
          mediaType: 'tv',
          exploreHref: '/discover?type=tv&genre=10765&genreName=Sci-Fi&view=grid',
        },
        {
          title: 'Kriminal & Investigasi Menegangkan',
          endpoint: 'discover/tv',
          params: { with_genres: '80', sort_by: 'popularity.desc' },
          mediaType: 'tv',
          exploreHref: '/discover?type=tv&genre=80&genreName=Kriminal&view=grid',
        },
        {
          title: 'Acara TV Peringkat Tertinggi',
          endpoint: 'tv/top_rated',
          params: {},
          mediaType: 'tv',
          exploreHref: '/discover?type=tv&view=grid',
        },
      ],
    };
  }

  // Default: Movies (/discover?type=movie or bare /discover)
  return {
    heroEndpoint: 'trending/movie/day',
    heroParams: {},
    mediaType: 'movie',
    badgeLabel: '#1 di Kategori Film Hari Ini',
    top10Title: 'Top 10 Film di Indonesia Hari Ini',
    rows: [
      {
        title: 'Film Blockbuster Terpopuler',
        endpoint: 'movie/popular',
        params: {},
        mediaType: 'movie',
        exploreHref: '/discover?type=movie&sortBy=popularity&view=grid',
      },
      {
        title: 'Aksi Penuh Adrenalin',
        endpoint: 'discover/movie',
        params: { with_genres: '28', sort_by: 'popularity.desc' },
        mediaType: 'movie',
        exploreHref: '/discover?type=movie&genre=28&genreName=Aksi&view=grid',
      },
      {
        title: 'Horor & Thriller Mencekam',
        endpoint: 'discover/movie',
        params: { with_genres: '27', sort_by: 'popularity.desc' },
        mediaType: 'movie',
        exploreHref: '/discover?type=movie&genre=27&genreName=Horor&view=grid',
      },
      {
        title: 'Komedi & Hiburan Santai',
        endpoint: 'discover/movie',
        params: { with_genres: '35', sort_by: 'popularity.desc' },
        mediaType: 'movie',
        exploreHref: '/discover?type=movie&genre=35&genreName=Komedi&view=grid',
      },
      {
        title: 'Film Peringkat Tertinggi Sepanjang Masa',
        endpoint: 'movie/top_rated',
        params: {},
        mediaType: 'movie',
        exploreHref: '/discover?type=movie&view=grid',
      },
    ],
  };
}

function RowSkeleton() {
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

async function CategoryHero({ endpoint, params, mediaType, badgeLabel }) {
  const data = await fetchTMDb(endpoint, params);
  const rawItems = (data?.results || [])
    .filter((item) => item.backdrop_path && (item.title || item.name) && !item.adult)
    .slice(0, 4)
    .map((item) => ({ ...item, media_type: item.media_type || mediaType }));

  if (rawItems.length === 0) return null;

  const items = await Promise.all(
    rawItems.map(async (item) => {
      const [enDetails, idDetails] = await Promise.all([
        fetchTMDb(`${item.media_type}/${item.id}`, {
          append_to_response: 'images',
          language: 'en-US',
          include_image_language: 'id,en,null',
        }),
        fetchTMDb(`${item.media_type}/${item.id}`, {
          language: 'id-ID',
        }),
      ]);
      if (!enDetails) return normalizeMediaItem(item);
      const logos = enDetails.images?.logos || [];
      const logo =
        logos.find((l) => l.iso_639_1 === 'id') ||
        logos.find((l) => l.iso_639_1 === 'en') ||
        logos[0];
      const cleanTitle = resolveReadableTitle(
        item.title || item.name,
        enDetails.title || enDetails.name
      );
      return normalizeMediaItem({
        ...item,
        title: item.title ? cleanTitle : item.title,
        name: item.name ? cleanTitle : item.name,
        overview: resolveReadableOverview(idDetails?.overview, item.overview || enDetails.overview),
        logoUrl: logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null,
      });
    })
  );

  return <HeroBanner items={items} badgeLabel={badgeLabel} />;
}

async function CategoryTop10({ endpoint, params, mediaType, title }) {
  const data = await fetchTMDb(endpoint, params);
  const items = (data?.results || [])
    .filter((item) => item.poster_path && !item.adult)
    .map((item) => ({ ...item, media_type: item.media_type || mediaType }));

  if (items.length === 0) return null;
  return <Top10Row title={title} items={items} />;
}

async function CategoryRow({ title, endpoint, params, mediaType, exploreHref }) {
  const data = await fetchTMDb(endpoint, params);
  const items = (data?.results || [])
    .filter((item) => (item.backdrop_path || item.poster_path) && !item.adult)
    .map((item) => ({ ...item, media_type: item.media_type || mediaType }));

  if (items.length === 0) return null;
  return <MovieRow title={title} items={items} exploreHref={exploreHref} />;
}

export default function DiscoverBrowseView({ searchParams, headerSlot }) {
  const config = getCategoryConfig(searchParams);

  return (
    <div className="relative pb-20 bg-[#141414]">
      {/* Sticky Netflix Category Sub-Header — floats transparently over Hero, then docks under #141414 Navbar on scroll */}
      {headerSlot}

      <div className="-mt-14">
        <Suspense
          fallback={
            <div className="w-full h-[78vh] min-h-[540px] max-h-[880px] md:h-[88vh] bg-[#181818] animate-pulse" />
          }
        >
          <CategoryHero
            endpoint={config.heroEndpoint}
            params={config.heroParams}
            mediaType={config.mediaType}
            badgeLabel={config.badgeLabel}
          />
        </Suspense>
      </div>

      {/* Overlapped Curated Category Rows */}
      <div className="relative z-20 -mt-20 sm:-mt-28 md:-mt-36 space-y-8 md:space-y-11">
        <Suspense fallback={<RowSkeleton />}>
          <CategoryTop10
            endpoint={config.heroEndpoint}
            params={config.heroParams}
            mediaType={config.mediaType}
            title={config.top10Title}
          />
        </Suspense>

        {config.rows.map((row) => (
          <Suspense key={row.title} fallback={<RowSkeleton />}>
            <CategoryRow
              title={row.title}
              endpoint={row.endpoint}
              params={row.params}
              mediaType={row.mediaType}
              exploreHref={row.exploreHref}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
}
