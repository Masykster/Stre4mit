"use client";

import Link from 'next/link';
import MediaHeroHeader from './MediaHeroHeader';
import EpisodeSelector from './EpisodeSelector';
import MoreLikeThisGrid from './MoreLikeThisGrid';
import CastRow from './CastRow';
import { getMatchScore, getMaturityBadge } from '@/app/lib/genres';

export default function MediaDetailView({
  data,
  mediaType,
  title,
  year,
  durationOrSeasons,
  genres = [],
  overview,
  cast = [],
  directorsOrCreators = [],
  directorLabel = 'Sutradara',
  recommendations = [],
  logoUrl,
  trailerKey,
  isModal = false,
}) {
  const matchScore = getMatchScore(data.vote_average);
  const maturity = getMaturityBadge(data);

  return (
    <div className={isModal ? 'bg-[#181818] text-zinc-100' : 'min-h-screen pb-20 bg-[#141414] text-zinc-100'}>
      {/* Top 16:9 Netflix Media Showcase Header */}
      <MediaHeroHeader
        data={data}
        mediaType={mediaType}
        title={title}
        logoUrl={logoUrl}
        trailerKey={trailerKey}
        isModal={isModal}
      />

      {/* Main Details Container */}
      <div
        className={
          isModal
            ? 'px-5 sm:px-10 pt-3 pb-12 space-y-10 bg-[#181818]'
            : 'max-w-6xl mx-auto px-4 md:px-12 pt-4 space-y-12'
        }
      >
        {/* Netflix 2-Column Metadata Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left 65%: Match %, Year, Maturity, Runtime/Seasons, HD, Synopsis */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold text-zinc-300">
              {matchScore && (
                <span className="text-emerald-400 font-bold text-sm sm:text-base">
                  {matchScore}% Cocok
                </span>
              )}
              {year && (
                <Link
                  href={`/discover?type=${mediaType}&year=${year}&view=grid`}
                  replace={isModal}
                  className="hover:text-white transition-colors"
                >
                  {year}
                </Link>
              )}
              <span className="border border-zinc-500 px-1.5 py-px text-xs text-zinc-200">
                {maturity}
              </span>
              {durationOrSeasons && <span>{durationOrSeasons}</span>}
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

          {/* Right 35%: Interactive Cast, Genres, Director/Creator */}
          <div className="md:col-span-4 space-y-3 text-xs sm:text-[13px] leading-relaxed">
            {cast.length > 0 && (
              <div>
                <span className="text-zinc-500">Pemeran: </span>
                {cast.slice(0, 4).map((c, idx) => (
                  <span key={c.id}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/person/${c.id}`}
                      replace={isModal}
                      className="text-zinc-200 hover:text-white hover:underline transition-colors"
                    >
                      {c.name}
                    </Link>
                  </span>
                ))}
                {cast.length > 4 && (
                  <a
                    href="#cast-section"
                    className="text-zinc-400 italic hover:text-white hover:underline ml-1"
                  >
                    , lainnya
                  </a>
                )}
              </div>
            )}

            {genres.length > 0 && (
              <div>
                <span className="text-zinc-500">Genre: </span>
                {genres.map((g, idx) => (
                  <span key={g.id}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/discover?type=${mediaType}&genre=${g.id}&genreName=${encodeURIComponent(g.name)}&view=grid`}
                      replace={isModal}
                      className="text-zinc-200 hover:text-white hover:underline transition-colors"
                    >
                      {g.name}
                    </Link>
                  </span>
                ))}
              </div>
            )}

            {directorsOrCreators.length > 0 && (
              <div>
                <span className="text-zinc-500">{directorLabel}: </span>
                {directorsOrCreators.map((person, idx) => (
                  <span key={person.id || person.name}>
                    {idx > 0 && ', '}
                    {person.id ? (
                      <Link
                        href={`/person/${person.id}`}
                        replace={isModal}
                        className="text-zinc-200 hover:text-white hover:underline transition-colors"
                      >
                        {person.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-200">{person.name}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Netflix 1-Column Episode List for TV Series */}
        {mediaType === 'tv' && (
          <EpisodeSelector
            tvId={data.id}
            seasons={data.seasons}
            seriesTitle={title}
            isModal={isModal}
          />
        )}

        {/* More Like This (Netflix 3-Column Rich Cards) */}
        <MoreLikeThisGrid items={recommendations} mediaType={mediaType} isModal={isModal} />

        {/* Clickable Cast Carousel */}
        <div id="cast-section">
          <CastRow cast={cast} titleLabel={`Tentang & Pemeran ${title}`} isModal={isModal} />
        </div>
      </div>
    </div>
  );
}
