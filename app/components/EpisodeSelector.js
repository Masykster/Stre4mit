"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

export default function EpisodeSelector({ tvId, seasons }) {
  // Filter seasons to only include valid ones (season_number > 0; season 0 is specials)
  const validSeasons = seasons?.filter(s => s.season_number > 0) || [];
  
  const [selectedSeason, setSelectedSeason] = useState(
    validSeasons.length > 0 ? validSeasons[0].season_number : 1
  );
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEpisodes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/tv/${tvId}/season/${selectedSeason}`);
        const data = await res.json();
        if (data.episodes) {
          setEpisodes(data.episodes);
        }
      } catch (err) {
        console.error("Failed to fetch episodes", err);
      } finally {
        setLoading(false);
      }
    }
    loadEpisodes();
  }, [tvId, selectedSeason]);

  if (validSeasons.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Season Selector Head */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-lg md:text-xl font-bold text-zinc-50">Episode</h2>
        <div className="relative">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="bg-zinc-900 text-zinc-100 pl-4 pr-8 py-2 rounded-lg border border-zinc-800 text-xs sm:text-sm font-semibold focus:outline-none focus:border-red-650 cursor-pointer appearance-none"
          >
            {validSeasons.map((s) => (
              <option key={s.id} value={s.season_number}>
                {s.name || `Musim ${s.season_number}`}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500 text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* Episodes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-lg animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {episodes.map((ep) => {
            const watchUrl = `/watch/tv/${tvId}/${selectedSeason}/${ep.episode_number}`;
            
            return (
              <Link 
                key={ep.id}
                href={watchUrl}
                className="group flex gap-3 p-3 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-850 hover:border-zinc-700/60 rounded-xl transition-all duration-150"
              >
                {/* Episode Backdrop Thumbnail */}
                <div className="relative w-24 sm:w-32 aspect-video bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0">
                  {ep.still_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                      alt={ep.name}
                      fill
                      sizes="(max-width: 640px) 96px, 128px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 font-bold">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Play size={16} className="text-white fill-white" />
                  </div>
                </div>

                {/* Episode Info */}
                <div className="flex-grow min-w-0 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">
                    Eps {ep.episode_number}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate group-hover:text-red-500 transition-colors mt-0.5">
                    {ep.name}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {ep.overview || "Tidak ada ringkasan episode."}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
