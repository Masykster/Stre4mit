"use client";

import Image from 'next/image';
import useDragScroll from '../hooks/useDragScroll';

export default function CastRow({ cast, titleLabel = 'Pemeran Utama' }) {
  const scrollRef = useDragScroll();

  if (!cast || cast.length === 0) return null;

  return (
    <section className="w-full min-w-0 space-y-4 pt-10 border-t border-white/10 text-left">
      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{titleLabel}</h2>
      <div
        ref={scrollRef}
        className="flex w-full gap-4 sm:gap-5 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x cursor-grab active:cursor-grabbing select-none"
      >
        {cast.map((c) => (
          <div
            key={c.id}
            className="flex w-24 sm:w-28 flex-shrink-0 snap-start flex-col items-center gap-2.5 text-center"
          >
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 bg-[#222222] rounded-full overflow-hidden ring-1 ring-white/10">
              {c.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-cover"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-500 font-bold px-2">
                  {c.name?.slice(0, 2)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="min-w-0 w-full">
              <p className="text-xs sm:text-[13px] font-semibold text-zinc-100 truncate">{c.name}</p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{c.character}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
