"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import useDragScroll from '../hooks/useDragScroll';

export default function Top10Row({ title = 'Top 10 di Indonesia Hari Ini', items }) {
  const scrollRef = useDragScroll();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [pageInfo, setPageInfo] = useState({ total: 1, active: 0 });

  const topItems = (items || []).filter((item) => item.poster_path).slice(0, 10);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 12);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);

    const viewWidth = Math.max(1, el.clientWidth);
    const totalPages = Math.max(1, Math.min(6, Math.ceil(el.scrollWidth / viewWidth)));
    const maxScroll = Math.max(1, el.scrollWidth - viewWidth);
    const ratio = Math.min(1, Math.max(0, el.scrollLeft / maxScroll));
    const activePage = Math.min(totalPages - 1, Math.round(ratio * (totalPages - 1)));
    setPageInfo({ total: totalPages, active: activePage });
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
  }, [scrollRef, updateScrollButtons, topItems.length]);

  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = Math.round(el.clientWidth * 0.85) * direction;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  if (topItems.length === 0) return null;

  return (
    <section className="group/row relative space-y-2.5">
      <div className="flex items-center justify-between gap-4 px-4 md:px-12">
        <h2 className="text-base sm:text-lg md:text-[20px] font-bold text-[#e5e5e5] tracking-tight select-none truncate">
          {title}
        </h2>

        {pageInfo.total > 1 && (
          <div
            aria-hidden="true"
            className="hidden sm:flex items-center gap-[3px] opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 flex-shrink-0"
          >
            {Array.from({ length: pageInfo.total }).map((_, idx) => (
              <span
                key={idx}
                className={`h-[2px] w-3 transition-colors duration-200 ${
                  idx === pageInfo.active ? 'bg-zinc-200' : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Geser Top 10 ke kiri"
            className="hidden md:flex absolute left-0 top-0 bottom-2 z-20 w-11 items-center justify-center bg-black/55 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 rounded-r-[4px] cursor-pointer"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto px-4 md:px-12 pb-2 no-scrollbar scroll-smooth snap-x cursor-grab active:cursor-grabbing select-none"
        >
          {topItems.map((item, idx) => {
            const rank = idx + 1;
            const isDoubleDigit = rank >= 10;

            return (
              <div
                key={`top10-${item.media_type || 'media'}-${item.id}`}
                className="group/top relative flex items-end w-[180px] sm:w-[205px] md:w-[230px] flex-shrink-0 snap-start"
              >
                {/* Giant Netflix Outlined SVG Numeral */}
                <svg
                  viewBox={isDoubleDigit ? '0 0 155 155' : '0 0 105 155'}
                  aria-hidden="true"
                  className="w-[50%] h-[145px] sm:h-[170px] md:h-[190px] -mr-4 sm:-mr-5 z-0 flex-shrink-0 pointer-events-none select-none overflow-visible"
                >
                  <text
                    x="50%"
                    y="142"
                    textAnchor="middle"
                    fill="#141414"
                    stroke="#595959"
                    strokeWidth="4.5"
                    strokeLinejoin="round"
                    style={{
                      fontSize: isDoubleDigit ? '132px' : '156px',
                      fontWeight: 900,
                      letterSpacing: isDoubleDigit ? '-10px' : '0px',
                      fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
                    }}
                    className="transition-colors duration-200 group-hover/top:stroke-zinc-300"
                  >
                    {rank}
                  </text>
                </svg>

                {/* Crisp 2:3 Poster paired with Netflix Hover Pop-out */}
                <div className="relative z-10 w-[56%] flex-shrink-0 shadow-xl shadow-black/70">
                  <MovieCard item={item} variant="poster" hideTitle isTop10 />
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Geser Top 10 ke kanan"
            className="hidden md:flex absolute right-0 top-0 bottom-2 z-20 w-11 items-center justify-center bg-black/55 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 rounded-l-[4px] cursor-pointer"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </section>
  );
}
