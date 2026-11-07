import {
  normalizeTMDbPayload,
  resolveReadableOverview,
  resolveReadableTitle,
} from '@/app/lib/romanize';

function pickLogoUrl(images) {
  const logos = images?.logos || [];
  const logo =
    logos.find((l) => l.iso_639_1 === 'id') ||
    logos.find((l) => l.iso_639_1 === 'en') ||
    logos[0];
  return logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;
}

function pickTrailerKey(videosPayload) {
  const videos = videosPayload?.results || [];
  const youtubeVideo =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
  return youtubeVideo?.key || null;
}

export async function getMovieDetailData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const enUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits,recommendations,images,videos&include_image_language=id,en,null&include_video_language=id,en,null`;
  const idUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=id-ID`;

  try {
    const [enRes, idRes] = await Promise.all([
      fetch(enUrl, { next: { revalidate: 3600 } }),
      fetch(idUrl, { next: { revalidate: 3600 } }),
    ]);

    if (!enRes.ok) return null;
    const enData = await enRes.json();
    const idData = idRes.ok ? await idRes.json() : null;

    const merged = normalizeTMDbPayload({
      ...enData,
      title: resolveReadableTitle(idData?.title, enData.title, enData.original_title),
      overview: resolveReadableOverview(idData?.overview, enData.overview),
      tagline: resolveReadableOverview(idData?.tagline, enData.tagline),
      genres: idData?.genres?.length ? idData.genres : enData.genres,
    });

    const directors = (merged.credits?.crew || [])
      .filter((c) => c.job === 'Director')
      .slice(0, 3)
      .map((c) => ({ id: c.id, name: c.name }));

    return {
      data: merged,
      mediaType: 'movie',
      title: merged.title,
      year: merged.release_date ? merged.release_date.split('-')[0] : '',
      durationOrSeasons: merged.runtime
        ? `${Math.floor(merged.runtime / 60)}j ${merged.runtime % 60}m`
        : '',
      genres: merged.genres || [],
      overview: merged.overview || 'Sinopsis belum tersedia.',
      cast: merged.credits?.cast?.slice(0, 14) || [],
      directorsOrCreators: directors,
      directorLabel: 'Sutradara',
      recommendations: (merged.recommendations?.results || [])
        .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
        .slice(0, 9),
      logoUrl: pickLogoUrl(merged.images),
      trailerKey: pickTrailerKey(merged.videos),
    };
  } catch (err) {
    console.error('Failed to fetch movie detail:', err);
    return null;
  }
}

export async function getTVDetailData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const enUrl = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits,recommendations,images,videos&include_image_language=id,en,null&include_video_language=id,en,null`;
  const idUrl = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=id-ID`;

  try {
    const [enRes, idRes] = await Promise.all([
      fetch(enUrl, { next: { revalidate: 3600 } }),
      fetch(idUrl, { next: { revalidate: 3600 } }),
    ]);

    if (!enRes.ok) return null;
    const enData = await enRes.json();
    const idData = idRes.ok ? await idRes.json() : null;

    const mergedSeasons = (enData.seasons || []).map((enSeason) => {
      const idSeason = idData?.seasons?.find((s) => s.season_number === enSeason.season_number);
      return {
        ...enSeason,
        name: resolveReadableTitle(idSeason?.name, enSeason.name),
      };
    });

    const merged = normalizeTMDbPayload({
      ...enData,
      name: resolveReadableTitle(idData?.name, enData.name, enData.original_name),
      overview: resolveReadableOverview(idData?.overview, enData.overview),
      tagline: resolveReadableOverview(idData?.tagline, enData.tagline),
      genres: idData?.genres?.length ? idData.genres : enData.genres,
      seasons: mergedSeasons,
    });

    const creators = (merged.created_by || []).map((c) => ({
      id: c.id,
      name: c.name,
    }));

    return {
      data: merged,
      mediaType: 'tv',
      title: merged.name,
      year: merged.first_air_date ? merged.first_air_date.split('-')[0] : '',
      durationOrSeasons: merged.number_of_seasons ? `${merged.number_of_seasons} Bagian` : '',
      genres: merged.genres || [],
      overview: merged.overview || 'Sinopsis belum tersedia.',
      cast: merged.credits?.cast?.slice(0, 14) || [],
      directorsOrCreators: creators,
      directorLabel: 'Kreator',
      recommendations: (merged.recommendations?.results || [])
        .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
        .slice(0, 9),
      logoUrl: pickLogoUrl(merged.images),
      trailerKey: pickTrailerKey(merged.videos),
    };
  } catch (err) {
    console.error('Failed to fetch TV detail:', err);
    return null;
  }
}

export async function getPersonDetailData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const enUrl = `https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}&language=en-US&append_to_response=combined_credits`;
  const idUrl = `https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}&language=id-ID`;

  try {
    const [enRes, idRes] = await Promise.all([
      fetch(enUrl, { next: { revalidate: 3600 } }),
      fetch(idUrl, { next: { revalidate: 3600 } }),
    ]);

    if (!enRes.ok) return null;
    const enData = await enRes.json();
    const idData = idRes.ok ? await idRes.json() : null;

    const merged = normalizeTMDbPayload({
      ...enData,
      name: resolveReadableTitle(idData?.name, enData.name),
      biography: resolveReadableOverview(idData?.biography, enData.biography),
    });

    const creditMap = new Map();

    const registerCredit = (rawItem, roleType) => {
      if (!rawItem || rawItem.adult) return;
      if (rawItem.media_type !== 'movie' && rawItem.media_type !== 'tv') return;
      if (!rawItem.backdrop_path && !rawItem.poster_path) return;

      const key = `${rawItem.media_type}-${rawItem.id}`;
      const existing = creditMap.get(key);
      if (existing) {
        if (!existing.creditRoles.includes(roleType)) {
          existing.creditRoles.push(roleType);
        }
        return;
      }

      creditMap.set(key, {
        ...rawItem,
        creditRoles: [roleType],
      });
    };

    (merged.combined_credits?.cast || []).forEach((item) => registerCredit(item, 'cast'));
    (merged.combined_credits?.crew || [])
      .filter((item) =>
        ['Director', 'Creator', 'Executive Producer', 'Writer', 'Screenplay'].includes(item.job)
      )
      .forEach((item) => registerCredit(item, 'crew'));

    const items = Array.from(creditMap.values()).sort((a, b) => {
      const scoreA = (a.popularity || 0) * ((a.vote_count || 0) > 25 ? 1.35 : 0.8);
      const scoreB = (b.popularity || 0) * ((b.vote_count || 0) > 25 ? 1.35 : 0.8);
      return scoreB - scoreA;
    });

    const departmentMap = {
      Acting: 'Pemeran',
      Directing: 'Sutradara',
      Writing: 'Penulis & Kreator',
      Production: 'Produser',
      Creator: 'Kreator',
    };

    return {
      person: {
        id: merged.id,
        name: merged.name,
        profile_path: merged.profile_path || null,
        department: departmentMap[merged.known_for_department] || 'Pemeran & Kreator',
        biography: merged.biography || '',
        place_of_birth: merged.place_of_birth || '',
      },
      items,
    };
  } catch (err) {
    console.error('Failed to fetch person detail:', err);
    return null;
  }
}
