"use client";

import Link from 'next/link';
import MediaHeroHeader from './MediaHeroHeader';
import MoreLikeThisGrid from './MoreLikeThisGrid';
import CastRow from './CastRow';
import { getMatchScore, getMaturityBadge } from '../lib/genres';

export default function MovieDetailClient({
  data,
  title,
  year,
  runtime,
  genres,
  overview,
  cast,
  director,
  recommendations,
  logoUrl,
  trailerKey,
}) {
  const matchScore = getMatchScore(data.vote_average);
  const maturity = getMaturityBadge(data);

  return (
    <div className="min-h-screen pb-20 bg-[#141414] text-zinc-100">
      {/* Top 16:9 Netflix Media Showcase Header */}
      <MediaHeroHeader
        data={data}
        mediaType="movie"
        title={title}
        logoUrl={logoUrl}
        trailerKey={trailerKey}
      />

      {/* Main Details Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-12 pt-4 space-y-12">
        {/* Netflix 2-Column Metadata Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left 65%: Match %, Year, Maturity, Runtime, HD, Synopsis */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold text-zinc-300">
              {matchScore && (
                <span className="text-emerald-400 font-bold text-sm sm:text-base">
                  {matchScore}% Cocok
                </span>
              )}
              {year && (
                <Link
                  href={`/discover?type=movie&year=${year}&view=grid`}
                  className="hover:text-white transition-colors"
                >
                  {year}
                </Link>
              )}
              <span className="border border-zinc-500 px-1.5 py-px text-xs text-zinc-200">
                {maturity}
              </span>
              {runtime && <span>{runtime}</span>}
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

          {/* Right 35%: Cast, Genres, Director */}
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
                      href={`/discover?type=movie&genre=${g.id}&genreName=${encodeURIComponent(g.name)}&view=grid`}
                      className="text-zinc-200 hover:underline"
                    >
                      {g.name}
                    </Link>
                  </span>
                ))}
              </div>
            )}

            {director && (
              <div>
                <span className="text-zinc-500">Sutradara: </span>
                <span className="text-zinc-200">{director}</span>
              </div>
            )}
          </div>
        </div>

        {/* More Like This (Netflix 3-Column Rich Cards) */}
        <MoreLikeThisGrid items={recommendations} mediaType="movie" />

        {/* Cast Carousel */}
        <CastRow cast={cast} titleLabel={`Tentang & Pemeran ${title}`} />
      </div>
    </div>
  );
}
