"use client";

import MovieCard from './MovieCard';
import useDragScroll from '../hooks/useDragScroll';

export default function MovieRow({ title, items }) {
  const scrollRef = useDragScroll();

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3 px-4 md:px-8">
      <h2 className="text-lg md:text-xl font-bold text-zinc-100 tracking-tight select-none">
        {title}
      </h2>
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x cursor-grab active:cursor-grabbing select-none"
      >
        {items.map((item) => (
          <div key={item.id} className="w-[140px] sm:w-[170px] md:w-[190px] flex-shrink-0 snap-start">
            <MovieCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
