"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MovieCard from './MovieCard';
import { buildDiscoverRequest, mapDiscoverResults, MONTHS, YEARS } from '../lib/discover';

export default function DiscoverList({ initialItems, searchParams }) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);
  const sentinelRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();

  const currentType = searchParams.type;
  const currentAnime = searchParams.anime === 'true';
  const currentDrama = searchParams.drama === 'true';
  const currentGenre = searchParams.genre;
  const currentGenreName = searchParams.genreName;

  const activeSubType = searchParams.subType || '';
  const activeSortBy = searchParams.sortBy || 'popularity';
  const activeMonth = searchParams.month || '';
  const activeYear = searchParams.year || '';

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();

    // Preserve core category searchParams
    if (currentType) params.set('type', currentType);
    if (currentAnime) params.set('anime', 'true');
    if (currentDrama) params.set('drama', 'true');
    if (currentGenre) {
      params.set('genre', currentGenre);
      if (currentGenreName) params.set('genreName', currentGenreName);
    }

    const merged = {
      subType: activeSubType,
      sortBy: activeSortBy,
      month: activeMonth,
      year: activeYear,
      ...newFilters,
    };

    if (merged.subType) params.set('subType', merged.subType);
    if (merged.sortBy) params.set('sortBy', merged.sortBy);
    if (merged.month) params.set('month', merged.month);
    if (merged.year) params.set('year', merged.year);
    params.set('view', 'grid');

    router.push(`${pathname}?${params.toString()}`);
  };

  const loadMoreItems = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;

    // Shared builder keeps client-side pagination in sync with the initial
    // server-side load in app/discover/page.js
    const { endpoint: apiEndpoint, query, mediaType } = buildDiscoverRequest(searchParams, nextPage);

    try {
      const res = await fetch(`/api/tmdb/${apiEndpoint}?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch next page");
      const data = await res.json();

      const formattedItems = mapDiscoverResults(data.results, mediaType);

      if (formattedItems.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => [...prev, ...formattedItems]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more discover items", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRef = useRef(loadMoreItems);
  useEffect(() => {
    loadMoreRef.current = loadMoreItems;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, []);

  // Format dropdown is shown for Anime and Drama pages
  const showFormatSelector = currentAnime || currentDrama;

  const monthOptions = [{ value: '', label: 'Semua Bulan' }, ...MONTHS];
  const yearOptions = [{ value: '', label: 'Semua Tahun' }, ...YEARS];

  return (
    <div className="space-y-6">
      {/* Crisp Netflix Dark Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end p-3.5 bg-[#181818] border border-white/10 rounded-[4px]">
        {showFormatSelector && (
          <div className="flex flex-col gap-1 min-w-[130px] flex-grow sm:flex-grow-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Format</span>
            <select
              value={activeSubType}
              onChange={(e) => updateFilters({ subType: e.target.value })}
              className="w-full bg-black text-zinc-100 border border-white/30 hover:border-white rounded-[2px] px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-white cursor-pointer transition-colors"
            >
              <option value="">Semua Format</option>
              <option value="movie">Film</option>
              <option value="tv">Serial TV</option>
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1 min-w-[150px] flex-grow sm:flex-grow-0">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Saran Untuk Anda</span>
          <select
            value={activeSortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="w-full bg-black text-zinc-100 border border-white/30 hover:border-white rounded-[2px] px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-white cursor-pointer transition-colors"
          >
            <option value="popularity">Terpopuler</option>
            <option value="release_date">Tahun Rilis Terbaru</option>
            <option value="title">A-Z</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[130px] flex-grow sm:flex-grow-0">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Bulan Rilis</span>
          <select
            value={activeMonth}
            onChange={(e) => updateFilters({ month: e.target.value })}
            className="w-full bg-black text-zinc-100 border border-white/30 hover:border-white rounded-[2px] px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-white cursor-pointer transition-colors"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[120px] flex-grow sm:flex-grow-0">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tahun</span>
          <select
            value={activeYear}
            onChange={(e) => updateFilters({ year: e.target.value })}
            className="w-full bg-black text-zinc-100 border border-white/30 hover:border-white rounded-[2px] px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-white cursor-pointer transition-colors"
          >
            {yearOptions.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Grid (16:9 Landscape Netflix Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {items.map((item) => (
          <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
        ))}
      </div>

      {/* Sentinel / Loading indicator */}
      {hasMore && (
        <div ref={sentinelRef} className="py-10 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold">
              <span className="w-5 h-5 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"></span>
              Memuat judul lainnya...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
