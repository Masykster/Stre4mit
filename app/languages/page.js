import { Suspense } from 'react';
import LanguageBrowserClient from '@/app/components/LanguageBrowserClient';
import { normalizeTMDbPayload } from '@/app/lib/romanize';

async function getInitialLanguageItems(lang, mediaType, sortMode) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return [];

  const today = new Date().toISOString().split('T')[0];
  const types = mediaType === 'movie' || mediaType === 'tv' ? [mediaType] : ['movie', 'tv'];

  try {
    const lists = await Promise.all(
      types.map(async (t) => {
        const query = new URLSearchParams({
          api_key: apiKey,
          with_original_language: lang,
          language: 'en-US',
          include_adult: 'false',
          page: '1',
        });

        if (sortMode === 'newest') {
          query.set('sort_by', t === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc');
          query.set(t === 'tv' ? 'first_air_date.lte' : 'primary_release_date.lte', today);
          query.set('vote_count.gte', '3');
        } else if (sortMode === 'rating') {
          query.set('sort_by', 'vote_average.desc');
          query.set('vote_count.gte', lang === 'id' ? '10' : '40');
        } else {
          query.set('sort_by', 'popularity.desc');
        }

        const res = await fetch(
          `https://api.themoviedb.org/3/discover/${t}?${query.toString()}`,
          { next: { revalidate: 1800 } }
        );
        if (!res.ok) return [];
        const data = normalizeTMDbPayload(await res.json());
        return (data.results || [])
          .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
          .map((item) => ({ ...item, media_type: t }));
      })
    );

    return lists.flat().sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } catch (err) {
    console.error('Initial language fetch failed:', err);
    return [];
  }
}

export const metadata = {
  title: 'Telusuri menurut Bahasa - Stre4mit',
};

export default async function LanguagesPage({ searchParams }) {
  const resolved = await searchParams;
  const lang = resolved?.lang || 'ko';
  const mediaType = resolved?.type || 'all';
  const sortMode = resolved?.sort || 'popularity';

  const initialItems = await getInitialLanguageItems(lang, mediaType, sortMode);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#141414]" />}>
      <LanguageBrowserClient
        initialItems={initialItems}
        initialLang={lang}
        initialType={mediaType}
        initialSort={sortMode}
      />
    </Suspense>
  );
}
