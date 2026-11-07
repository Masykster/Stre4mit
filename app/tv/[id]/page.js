import Link from 'next/link';
import { notFound } from 'next/navigation';
import MediaHeroHeader from '../../components/MediaHeroHeader';
import EpisodeSelector from '../../components/EpisodeSelector';
import MoreLikeThisGrid from '../../components/MoreLikeThisGrid';
import CastRow from '../../components/CastRow';
import { getMatchScore, getMaturityBadge } from '../../lib/genres';

async function getTVData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const url = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=id-ID&append_to_response=credits,recommendations,images,videos&include_image_language=id,en,null&include_video_language=id,en,null`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.overview) {
      const enRes = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=en-US`,
        { next: { revalidate: 3600 } }
      );
      if (enRes.ok) {
        const enData = await enRes.json();
        data.overview = enData.overview || '';
        data.tagline = data.tagline || enData.tagline || '';
      }
    }

    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function TVDetails({ params }) {
  const resolvedParams = await params;
  const data = await getTVData(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const title = data.name;
  const year = data.first_air_date ? data.first_air_date.split('-')[0] : '';
  const seasonsInfo = data.number_of_seasons
    ? `${data.number_of_seasons} Bagian`
    : '';
  const genres = data.genres || [];
  const overview = data.overview || 'Sinopsis belum tersedia.';
  const cast = data.credits?.cast?.slice(0, 14) || [];
  const creators = (data.created_by || []).map((c) => c.name).join(', ');
  const recommendations = (data.recommendations?.results || [])
    .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
    .slice(0, 9);

  const logos = data.images?.logos || [];
  const logo =
    logos.find((l) => l.iso_639_1 === 'id') ||
    logos.find((l) => l.iso_639_1 === 'en') ||
    logos[0];
  const logoUrl = logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;

  const videos = data.videos?.results || [];
  const youtubeVideo =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  const matchScore = getMatchScore(data.vote_average);
  const maturity = getMaturityBadge(data);

  return (
    <div className="min-h-screen pb-20 bg-[#141414] text-zinc-100">
      {/* Top 16:9 Netflix Media Showcase Header */}
      <MediaHeroHeader
        data={data}
        mediaType="tv"
        title={title}
        logoUrl={logoUrl}
        trailerKey={youtubeVideo?.key || null}
      />

      {/* Main Details Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-12 pt-4 space-y-12">
        {/* Netflix 2-Column Metadata Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left 65%: Match %, Year, Maturity, Seasons, HD, Synopsis */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold text-zinc-300">
              {matchScore && (
                <span className="text-emerald-400 font-bold text-sm sm:text-base">
                  {matchScore}% Cocok
                </span>
              )}
              {year && (
                <Link
                  href={`/discover?type=tv&year=${year}&view=grid`}
                  className="hover:text-white transition-colors"
                >
                  {year}
                </Link>
              )}
              <span className="border border-zinc-500 px-1.5 py-px text-xs text-zinc-200">
                {maturity}
              </span>
              {seasonsInfo && <span>{seasonsInfo}</span>}
              <span className="border border-zinc-500/80 rounded-[2px] px-1.5 py-px text-[10px] text-zinc-300 font-bold">
                HD
              </span>
            </div>

            {data.tagline && (
              <p className="text-sm sm:text-base font-bold text-white italic">
                &ldquo;{data.tagline}&rdquo;
              </p>
            )}

            <p className="text-zinc-200 text-sm sm:text-[15px] leading-relaxed">
              {overview}
            </p>
          </div>

          {/* Right 35%: Cast, Genres, Creators */}
          <div className="md:col-span-4 space-y-3 text-xs sm:text-[13px] leading-relaxed">
            {cast.length > 0 && (
              <div>
                <span className="text-zinc-500">Pemeran: </span>
                <span className="text-zinc-200">
                  {cast.slice(0, 4).map((c) => c.name).join(', ')}
                  {cast.length > 4 ? ', lainnya' : ''}
                </span>
              </div>
            )}

            {genres.length > 0 && (
              <div>
                <span className="text-zinc-500">Genre: </span>
                {genres.map((g, idx) => (
                  <span key={g.id}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/discover?type=tv&genre=${g.id}&genreName=${encodeURIComponent(g.name)}&view=grid`}
                      className="text-zinc-200 hover:underline"
                    >
                      {g.name}
                    </Link>
                  </span>
                ))}
              </div>
            )}

            {creators && (
              <div>
                <span className="text-zinc-500">Kreator: </span>
                <span className="text-zinc-200">{creators}</span>
              </div>
            )}
          </div>
        </div>

        {/* Netflix 1-Column Episode List */}
        <EpisodeSelector tvId={data.id} seasons={data.seasons} seriesTitle={title} />

        {/* More Like This (Netflix 3-Column Rich Cards) */}
        <MoreLikeThisGrid items={recommendations} mediaType="tv" />

        {/* Cast Carousel */}
        <CastRow cast={cast} titleLabel={`Tentang & Pemeran ${title}`} />
      </div>
    </div>
  );
}
