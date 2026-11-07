import { NextResponse } from 'next/server';
import {
  normalizeTMDbPayload,
  resolveReadableOverview,
  resolveReadableTitle,
} from '@/app/lib/romanize';

async function fetchTMDbJson(path, query) {
  const url = `https://api.themoviedb.org/3/${path}?${query.toString()}`;
  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });
  return res;
}

export async function GET(request, { params }) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    return NextResponse.json(
      { error: 'TMDb API Key not configured. Please add TMDB_API_KEY to your .env.local file.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');

  const query = new URLSearchParams(searchParams);
  query.set('api_key', apiKey);
  query.set('include_adult', 'false');

  // Default to en-US for list/search endpoints so official English/Romaji titles
  // are returned before falling back to automated romanization.
  if (!query.has('language')) {
    query.set('language', 'en-US');
  }

  try {
    const isSeasonEndpoint = /^tv\/\d+\/season\/\d+$/.test(path);

    if (isSeasonEndpoint && query.get('language') === 'id-ID') {
      const enQuery = new URLSearchParams(query);
      enQuery.set('language', 'en-US');

      const [idRes, enRes] = await Promise.all([
        fetchTMDbJson(path, query),
        fetchTMDbJson(path, enQuery),
      ]);

      if (!idRes.ok) {
        const errorData = await idRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.status_message || `TMDb API returned status ${idRes.status}` },
          { status: idRes.status }
        );
      }

      const idData = await idRes.json();
      const enData = enRes.ok ? await enRes.json() : null;

      if (enData && Array.isArray(idData.episodes) && Array.isArray(enData.episodes)) {
        const enMap = new Map(enData.episodes.map((ep) => [ep.episode_number, ep]));
        idData.episodes = idData.episodes.map((ep) => {
          const enEp = enMap.get(ep.episode_number);
          return {
            ...ep,
            name: resolveReadableTitle(ep.name, enEp?.name),
            overview: resolveReadableOverview(ep.overview, enEp?.overview),
          };
        });
      }

      idData.name = resolveReadableTitle(idData.name, enData?.name);
      return NextResponse.json(normalizeTMDbPayload(idData));
    }

    const res = await fetchTMDbJson(path, query);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.status_message || `TMDb API returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Ensure all non-Latin scripts in titles, names, cast/crew, and overviews are romanized cleanly.
    return NextResponse.json(normalizeTMDbPayload(data));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
