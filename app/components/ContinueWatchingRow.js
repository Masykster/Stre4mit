"use client";

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Info, X, ChevronLeft, ChevronRight } from 'lucide-react';
import useDragScroll from '../hooks/useDragScroll';

export default function ContinueWatchingRow() {
  const { history, removeFromHistory, isLoaded } = useApp();
  const scrollRef = useDragScroll();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 12);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const frame = requestAnimationFrame(updateScrollButtons);
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [scrollRef, updateScrollButtons, history.length]);

  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.round(el.clientWidth * 0.85) * direction, behavior: 'smooth' });
  };

  if (!isLoaded || history.length === 0) return null;

  return (
    <section className="group/row relative space-y-2.5">
      <div className="px-4 md:px-12">
        <h2 className="text-base sm:text-lg md:text-[20px] font-bold text-[#e5e5e5] tracking-tight select-none">
          Lanjutkan Menonton
        </h2>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Geser Lanjutkan Menonton ke kiri"
            className="hidden md:flex absolute left-0 top-0 bottom-2 z-20 w-11 items-center justify-center bg-black/55 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 rounded-r-[4px] cursor-pointer"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-2.5 overflow-x-auto px-4 md:px-12 pb-2 no-scrollbar scroll-smooth snap-x cursor-grab active:cursor-grabbing select-none"
        >
          {history.map((item) => {
            const mediaType = item.media_type || 'movie';
            const isTV = mediaType === 'tv';
            const watchHref = isTV
              ? `/watch/tv/${item.id}/${item.season || 1}/${item.episode || 1}`
              : `/watch/movie/${item.id}`;
            const detailHref = `/${mediaType}/${item.id}`;

            // Deterministic realistic progress indicator (35% - 82%) when exact duration isn't exposed by cross-origin iframe
            const progressPct = typeof item.progress === 'number'
              ? item.progress
              : 35 + ((Number(item.id) * 17 + (Number(item.episode) || 1) * 13) % 48);

            return (
              <div
                key={`${item.id}-${mediaType}`}
                className="group relative w-[205px] sm:w-[235px] md:w-[260px] lg:w-[280px] flex-shrink-0 bg-[#181818] rounded-[4px] overflow-hidden snap-start ring-1 ring-white/10"
              >
                {/* 16:9 Thumbnail + Play Ring + Red Progress Bar */}
                <Link href={watchHref} className="block relative w-full aspect-video bg-[#141414] overflow-hidden">
                  {item.backdrop_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
                      alt={item.title || item.name}
                      fill
                      sizes="(max-width: 640px) 205px, 280px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500 font-semibold p-4 text-center">
                      {item.title || item.name}
                    </div>
                  )}

                  {/* Centered Netflix Play Circle */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-11 h-11 rounded-full bg-black/65 border-2 border-white flex items-center justify-center text-white shadow-lg transition-transform duration-150 group-hover:scale-105">
                      <Play size={18} className="fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Netflix Red Bottom Progress Bar */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-700/80">
                    <div
                      style={{ width: `${progressPct}%` }}
                      className="h-full bg-[#E50914]"
                    />
                  </div>
                </Link>

                {/* Compact Netflix Action Strip */}
                <div className="px-3 py-2 flex items-center justify-between gap-2 bg-[#181818]">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-zinc-100 truncate">
                      {item.title || item.name}
                    </h3>
                    {isTV ? (
                      <p className="text-[11px] text-zinc-400 font-semibold">
                        B{item.season || 1}:E{item.episode || 1}
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-500 font-medium">Lanjutkan</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={detailHref}
                      title="Episode & Info"
                      aria-label={`Detail ${item.title || item.name}`}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Info size={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromHistory(item.id, mediaType)}
                      title="Hapus dari baris"
                      aria-label={`Hapus ${item.title || item.name} dari Lanjutkan Menonton`}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Geser Lanjutkan Menonton ke kanan"
            className="hidden md:flex absolute right-0 top-0 bottom-2 z-20 w-11 items-center justify-center bg-black/55 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 rounded-l-[4px] cursor-pointer"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </section>
  );
}
