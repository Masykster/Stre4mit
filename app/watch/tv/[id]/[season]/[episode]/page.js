import { notFound } from 'next/navigation';
import VideoPlayer from '../../../../../components/VideoPlayer';
import {
  normalizeTMDbPayload,
  resolveReadableOverview,
  resolveReadableTitle,
} from '@/app/lib/romanize';

async function getTVWatchData(id, seasonNum) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  try {
    const [tvEnRes, tvIdRes, seasonEnRes, seasonIdRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=en-US`, {
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=id-ID`, {
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${apiKey}&language=en-US`, {
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${apiKey}&language=id-ID`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!tvEnRes.ok || !seasonEnRes.ok) return null;

    const tvEn = await tvEnRes.json();
    const tvId = tvIdRes.ok ? await tvIdRes.json() : null;
    const seasonEn = await seasonEnRes.json();
    const seasonId = seasonIdRes.ok ? await seasonIdRes.json() : null;

    const idEpMap = new Map(
      (seasonId?.episodes || []).map((ep) => [ep.episode_number, ep])
    );

    const mergedEpisodes = (seasonEn.episodes || []).map((enEp) => {
      const idEp = idEpMap.get(enEp.episode_number);
      return {
        ...enEp,
        name: resolveReadableTitle(idEp?.name, enEp.name),
        overview: resolveReadableOverview(idEp?.overview, enEp.overview),
      };
    });

    const mergedSeasons = (tvEn.seasons || []).map((enS) => {
      const idS = tvId?.seasons?.find((s) => s.season_number === enS.season_number);
      return {
        ...enS,
        name: resolveReadableTitle(idS?.name, enS.name),
      };
    });

    return {
      tv: normalizeTMDbPayload({
        ...tvEn,
        name: resolveReadableTitle(tvId?.name, tvEn.name, tvEn.original_name),
        seasons: mergedSeasons,
      }),
      season: normalizeTMDbPayload({
        ...seasonEn,
        episodes: mergedEpisodes,
      }),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function WatchTV({ params }) {
  const resolvedParams = await params;
  const { id, season, episode } = resolvedParams;
  const seasonNum = Number(season);
  const epNum = Number(episode);

  const data = await getTVWatchData(id, seasonNum);
  if (!data) notFound();

  const episodes = data.season.episodes || [];
  const currentEpisodeObj = episodes.find((e) => Number(e.episode_number) === epNum);
  const totalSeasons = data.tv.number_of_seasons || 1;

  const hasPrevInSeason = epNum - 1 >= 1;
  const hasNextInSeason = epNum + 1 <= episodes.length;
  const hasNextSeason = seasonNum + 1 <= totalSeasons;

  let prevEpisodeHref = null;
  let nextEpisodeHref = null;

  if (hasPrevInSeason) {
    prevEpisodeHref = `/watch/tv/${id}/${seasonNum}/${epNum - 1}`;
  } else if (seasonNum - 1 >= 1) {
    prevEpisodeHref = `/watch/tv/${id}/${seasonNum - 1}/1`;
  }

  if (hasNextInSeason) {
    nextEpisodeHref = `/watch/tv/${id}/${seasonNum}/${epNum + 1}`;
  } else if (hasNextSeason) {
    nextEpisodeHref = `/watch/tv/${id}/${seasonNum + 1}/1`;
  }

  return (
    <VideoPlayer
      id={id}
      type="tv"
      title={data.tv.name}
      episodeTitle={currentEpisodeObj?.name || ''}
      backdropPath={data.tv.backdrop_path}
      season={seasonNum}
      episode={epNum}
      episodes={episodes}
      seasons={data.tv.seasons || []}
      nextEpisodeHref={nextEpisodeHref}
      prevEpisodeHref={prevEpisodeHref}
    />
  );
}
