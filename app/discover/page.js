import DiscoverList from '../components/DiscoverList';
import DiscoverBrowseView from '../components/DiscoverBrowseView';
import DiscoverHeaderBar from '../components/DiscoverHeaderBar';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { buildDiscoverRequest, mapDiscoverResults } from '../lib/discover';
import { normalizeTMDbPayload } from '@/app/lib/romanize';

async function getDiscoverData(searchParams) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];

  // Shared query builder keeps this in sync with client-side pagination
  const { endpoint, query, mediaType } = buildDiscoverRequest({
    sortBy: 'popularity',
    ...searchParams,
  });

  const authorizedQuery = new URLSearchParams(query);
  authorizedQuery.set('api_key', apiKey);

  const url = `https://api.themoviedb.org/3/${endpoint}?${authorizedQuery.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = normalizeTMDbPayload(await res.json());

    return mapDiscoverResults(data.results, mediaType);
  } catch (err) {
    console.error("Discover fetch error:", err);
    return [];
  }
}

function buildCategoryMeta(searchParams) {
  const { type, anime, drama, genreName } = searchParams;

  let categoryLabel = 'Film';
  const baseParams = new URLSearchParams();

  if (anime === 'true') {
    categoryLabel = 'Anime';
    baseParams.set('anime', 'true');
  } else if (drama === 'true') {
    categoryLabel = 'Drama';
    baseParams.set('drama', 'true');
  } else if (type === 'tv') {
    categoryLabel = 'Acara TV';
    baseParams.set('type', 'tv');
  } else if (type === 'movie') {
    categoryLabel = 'Film';
    baseParams.set('type', 'movie');
  } else if (genreName) {
    categoryLabel = 'Telusuri';
  }

  const baseQuery = baseParams.toString();
  const browseHref = baseQuery ? `/discover?${baseQuery}&view=rows` : '/discover?type=movie&view=rows';

  const gridParams = new URLSearchParams(baseParams);
  if (searchParams.genre) gridParams.set('genre', searchParams.genre);
  if (searchParams.genreName) gridParams.set('genreName', searchParams.genreName);
  if (searchParams.year) gridParams.set('year', searchParams.year);
  if (searchParams.month) gridParams.set('month', searchParams.month);
  if (searchParams.sortBy) gridParams.set('sortBy', searchParams.sortBy);
  if (searchParams.subType) gridParams.set('subType', searchParams.subType);
  gridParams.set('view', 'grid');
  const gridHref = `/discover?${gridParams.toString()}`;

  return {
    categoryLabel,
    baseCategoryHref: browseHref,
    browseHref,
    gridHref,
  };
}

export default async function DiscoverPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { genre, genreName, year, month, sortBy, subType, view } = resolvedSearchParams;

  const hasSpecificFilter = Boolean(genre || year || month || sortBy || subType);
  const isBrowseMode = view === 'rows' || (view !== 'grid' && !hasSpecificFilter);

  const { categoryLabel, baseCategoryHref, browseHref, gridHref } = buildCategoryMeta(resolvedSearchParams);

  const headerBar = (
    <DiscoverHeaderBar
      categoryLabel={categoryLabel}
      baseCategoryHref={baseCategoryHref}
      activeGenreName={genreName || null}
      isBrowseMode={isBrowseMode}
      browseHref={browseHref}
      gridHref={gridHref}
      searchParams={resolvedSearchParams}
    />
  );

  // Mode 1: Netflix Category Browse (Sticky Sub-Header + Hero Billboard + Top 10 + Curated Rows)
  if (isBrowseMode) {
    return (
      <DiscoverBrowseView
        searchParams={resolvedSearchParams}
        headerSlot={headerBar}
      />
    );
  }

  // Mode 2: Filter & Infinite Scroll Grid with Sticky Sub-Header
  const items = await getDiscoverData(resolvedSearchParams);

  return (
    <div className="relative min-h-screen pb-20 bg-[#141414] text-zinc-100 pt-16 md:pt-[68px]">
      {headerBar}

      <div className="px-4 md:px-12 pt-4">
        {items.length > 0 ? (
          <DiscoverList
            key={JSON.stringify(resolvedSearchParams)}
            initialItems={items}
            searchParams={resolvedSearchParams}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
            <Film className="text-zinc-600 w-14 h-14" />
            <h2 className="text-base md:text-lg font-bold text-zinc-200">Judul Tidak Ditemukan</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tidak ada tayangan yang cocok untuk kombinasi filter ini. Coba pilih genre atau tahun lainnya.
            </p>
            <Link
              href={browseHref}
              className="inline-flex items-center justify-center bg-white hover:bg-white/85 active:scale-95 text-black font-bold text-xs px-6 py-2.5 rounded-[4px] transition-all duration-150"
            >
              Kembali ke {categoryLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
