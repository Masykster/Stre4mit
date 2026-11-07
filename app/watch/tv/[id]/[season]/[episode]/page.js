import { notFound } from 'next/navigation';
import VideoPlayer from '../../../../../components/VideoPlayer';

async function getTVWatchData(id, seasonNum) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  try {
    const [tvRes, seasonRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=id-ID`, {
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${apiKey}&language=id-ID`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!tvRes.ok || !seasonRes.ok) return null;

    const tvData = await tvRes.json();
    const seasonData = await seasonRes.json();

    return {
      tv: tvData,
      season: seasonData,
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
