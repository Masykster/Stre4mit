"use client";

import { useApp } from '../context/AppContext';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Trash2 } from 'lucide-react';

export default function ContinueWatchingRow() {
  const { history, removeFromHistory, isLoaded } = useApp();

  if (!isLoaded || history.length === 0) return null;

  return (
    <div className="space-y-3 px-4 md:px-8">
      <h2 className="text-lg md:text-xl font-bold text-zinc-100 tracking-tight">
        Lanjutkan Menonton
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x">
        {history.map((item) => {
          const mediaType = item.media_type || 'movie';
          const isTV = mediaType === 'tv';
          const href = isTV 
            ? `/watch/tv/${item.id}/${item.season}/${item.episode}` 
            : `/watch/movie/${item.id}`;
          
          return (
            <div key={`${item.id}-${mediaType}`} className="group relative w-[200px] sm:w-[260px] flex-shrink-0 bg-zinc-900 rounded-lg overflow-hidden snap-start border border-zinc-800/40">
              {/* Backdrop image */}
              <div className="relative w-full aspect-video bg-zinc-950">
                {item.backdrop_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${item.backdrop_path}`}
                    alt={item.title || item.name}
                    fill
                    sizes="(max-width: 640px) 150px, 260px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600 font-semibold p-4 text-center">
                    {item.title || item.name}
                  </div>
                )}
                {/* Play hover button */}
                <Link href={href} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-100">
                    <Play size={18} className="fill-white translate-x-0.5" />
                  </div>
                </Link>
              </div>

              {/* Info panel */}
              <div className="p-3 pr-10 relative">
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate pr-2">
                  {item.title || item.name}
                </h3>
                {isTV && (
                  <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-0.5">
                    S{item.season} E{item.episode}
                  </p>
                )}
                <button
                  onClick={() => removeFromHistory(item.id, mediaType)}
                  className="absolute right-2 bottom-3 text-zinc-500 hover:text-red-500 p-1 transition-colors duration-150"
                  title="Hapus dari history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
