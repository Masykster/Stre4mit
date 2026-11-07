"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function EpisodeSelector({ tvId, seasons, seriesTitle = '' }) {
  const { history } = useApp();
  // Filter seasons to only include valid ones (season_number > 0; season 0 is specials)
  const validSeasons = seasons?.filter((s) => s.season_number > 0) || [];

  const [selectedSeason, setSelectedSeason] = useState(
    validSeasons.length > 0 ? validSeasons[0].season_number : 1
  );
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const savedTV = history.find((h) => Number(h.id) === Number(tvId) && h.media_type === 'tv');

  useEffect(() => {
    let cancelled = false;
    async function loadEpisodes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/tv/${tvId}/season/${selectedSeason}?language=id-ID`);
        const data = await res.json();
        if (!cancelled && data.episodes) {
          setEpisodes(data.episodes);
        }
      } catch (err) {
        console.error("Failed to fetch episodes", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadEpisodes();
    return () => {
      cancelled = true;
    };
  }, [tvId, selectedSeason]);

  if (validSeasons.length === 0) return null;

  const activeSeasonObj = validSeasons.find((s) => s.season_number === selectedSeason);

  return (
    <section className="space-y-4 pt-8 border-t border-white/10">
      {/* Netflix Season Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Episode</h2>
          {seriesTitle && (
            <p className="text-xs text-zinc-400">
              {activeSeasonObj?.name || `Bagian ${selectedSeason}`} • {seriesTitle}
            </p>
          )}
        </div>

        {validSeasons.length > 1 ? (
          <div className="relative">
            <select
              id="season-selector"
              name="season"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="bg-[#242424] hover:bg-[#2e2e2e] text-white pl-4 pr-9 py-2 rounded-[4px] border border-white/30 text-xs sm:text-sm font-bold focus:outline-none focus:border-white cursor-pointer appearance-none transition-colors"
            >
              {validSeasons.map((s) => (
                <option key={s.id} value={s.season_number}>
                  {s.name || `Bagian ${s.season_number}`} ({s.episode_count} Episode)
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-300 text-[10px]">
              ▼
            </div>
          </div>
        ) : (
          <span className="text-sm font-bold text-zinc-300">
            {activeSeasonObj?.name || 'Bagian 1'}
          </span>
        )}
      </div>

      {/* Netflix Vertical 1-Column Episode Rows */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-[#1f1f1f] rounded-[4px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/10 border-b border-white/10">
          {episodes.map((ep) => {
            const watchUrl = `/watch/tv/${tvId}/${selectedSeason}/${ep.episode_number}`;
            const isLastWatched =
              savedTV &&
              Number(savedTV.season) === Number(selectedSeason) &&
              Number(savedTV.episode) === Number(ep.episode_number);

            return (
              <Link
                key={ep.id}
                href={watchUrl}
                className={`group flex items-center gap-3 sm:gap-5 px-2 sm:px-5 py-4 sm:py-5 rounded-[4px] transition-colors duration-150 ${
                  isLastWatched ? 'bg-[#232323]' : 'hover:bg-[#232323]/80'
                }`}
              >
                {/* Episode Number */}
                <span
                  className={`w-6 sm:w-8 flex-shrink-0 text-center text-lg sm:text-2xl font-bold select-none ${
                    isLastWatched ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {ep.episode_number}
                </span>

                {/* 16:9 Episode Still Thumbnail */}
                <div className="relative w-28 sm:w-36 md:w-40 aspect-video bg-[#181818] rounded-[4px] overflow-hidden flex-shrink-0">
                  {ep.still_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                      alt={ep.name}
                      fill
                      sizes="(max-width: 640px) 112px, 160px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 font-bold">
                      Ep {ep.episode_number}
                    </div>
                  )}

                  {/* Centered Netflix Play Circle on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="h-10 w-10 rounded-full bg-black/65 border-2 border-white flex items-center justify-center text-white">
                      <Play size={16} className="fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Red Resume Indicator Bar if Last Watched */}
                  {isLastWatched && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-700">
                      <div className="w-3/5 h-full bg-[#E50914]" />
                    </div>
                  )}
                </div>

                {/* Episode Title, Runtime & Synopsis */}
                <div className="flex-grow min-w-0 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="text-xs sm:text-[15px] font-bold text-white truncate">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h4>
                    {ep.runtime ? (
                      <span className="text-xs sm:text-sm font-medium text-zinc-300 flex-shrink-0">
                        {ep.runtime}m
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] sm:text-[13px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {ep.overview || 'Belum ada deskripsi untuk episode ini.'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
