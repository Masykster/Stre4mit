"use client";

import Image from 'next/image';
import useDragScroll from '../hooks/useDragScroll';

export default function CastRow({ cast }) {
  const scrollRef = useDragScroll();

  if (!cast || cast.length === 0) return null;

  return (
    <div className="w-full min-w-0 space-y-4 pt-2 text-left">
      <h2 className="text-base sm:text-lg font-bold text-zinc-200">Pemeran Utama</h2>
      <div
        ref={scrollRef}
        className="flex w-full gap-5 sm:gap-6 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x cursor-grab active:cursor-grabbing select-none"
      >
        {cast.map((c) => (
          <div
            key={c.id}
            className="flex w-24 sm:w-28 flex-shrink-0 snap-start flex-col items-center gap-2 text-center"
          >
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              {c.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
                  className="object-cover"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 font-bold">
                  No Pic
                </div>
              )}
            </div>
            <div className="min-w-0 w-full">
              <p className="text-xs sm:text-sm font-bold text-zinc-100 truncate">{c.name}</p>
              <p className="text-[10px] sm:text-xs text-zinc-500 truncate mt-0.5">{c.character}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
