"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import useDragScroll from '../hooks/useDragScroll';

export default function MovieRow({ title, items, exploreHref }) {
  const scrollRef = useDragScroll();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
  }, [scrollRef, updateScrollButtons, items?.length]);

  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = Math.round(el.clientWidth * 0.85) * direction;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="group/row relative space-y-2.5">
      {/* Row Header with Netflix slide-in "Telusuri Semua" */}
      <div className="flex items-baseline gap-3 px-4 md:px-12">
        {exploreHref ? (
          <Link
            href={exploreHref}
            className="group/title inline-flex items-baseline gap-2.5 select-none"
          >
            <h2 className="text-base sm:text-lg md:text-[20px] font-bold text-[#e5e5e5] group-hover/title:text-white tracking-tight transition-colors">
              {title}
            </h2>
            <span className="inline-flex items-center text-xs font-bold text-[#54b9c5] opacity-0 -translate-x-2 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300">
              Telusuri Semua
              <ChevronRight size={14} className="ml-0.5" />
            </span>
          </Link>
        ) : (
          <h2 className="text-base sm:text-lg md:text-[20px] font-bold text-[#e5e5e5] tracking-tight select-none">
            {title}
          </h2>
        )}
      </div>

      {/* Horizontal Carousel Container */}
      <div className="relative">
        {/* Left Hover Chevron */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label={`Geser ${title} ke kiri`}
            className="hidden md:flex absolute left-0 top-0 bottom-2 z-20 w-11 items-center justify-center bg-black/55 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 rounded-r-[4px] cursor-pointer"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-2.5 overflow-x-auto px-4 md:px-12 pb-2 no-scrollbar scroll-smooth snap-x cursor-grab active:cursor-grabbing select-none"
        >
          {items.map((item) => (
            <div
              key={`${item.media_type || 'media'}-${item.id}`}
              className="w-[205px] sm:w-[235px] md:w-[260px] lg:w-[280px] flex-shrink-0 snap-start"
            >
              <MovieCard item={item} />
            </div>
          ))}
        </div>

        {/* Right Hover Chevron */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label={`Geser ${title} ke kanan`}
            className="hidden md:flex absolute right-0 top-0 bottom-2 z-20 w-11 items-center justify-center bg-black/55 hover:bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 rounded-l-[4px] cursor-pointer"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </section>
  );
}
