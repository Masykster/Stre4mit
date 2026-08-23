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
  const activeSortBy = searchParams.sortBy || 'release_date';
  const activeMonth = searchParams.month || '';
  const activeYear = searchParams.year || '';

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    
    // Preserve core searchParams
    if (currentType) params.set('type', currentType);
    if (currentAnime) params.set('anime', 'true');
    if (currentDrama) params.set('drama', 'true');
    if (currentGenre) {
      params.set('genre', currentGenre);
      if (currentGenreName) params.set('genreName', currentGenreName);
    }

    // Merge new filters
    const merged = {
      subType: activeSubType,
      sortBy: activeSortBy,
      month: activeMonth,
      year: activeYear,
      ...newFilters
    };

    if (merged.subType) params.set('subType', merged.subType);
    if (merged.sortBy && merged.sortBy !== 'release_date') params.set('sortBy', merged.sortBy);
    if (merged.month) params.set('month', merged.month);
    if (merged.year) params.set('year', merged.year);

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
        setItems(prev => [...prev, ...formattedItems]);
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
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreRef.current();
      }
    }, { threshold: 0.1 });

    observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, []);

  // Format dropdown is shown for Anime and Drama pages
  const showFormatSelector = currentAnime || currentDrama;

  // Shared option lists (navbar dropdowns use the same YEARS constant)
  const monthOptions = [{ value: '', label: 'Semua Bulan' }, ...MONTHS];
  const yearOptions = [{ value: '', label: 'Semua Tahun' }, ...YEARS];

  return (
    <div className="space-y-8">
      {/* Interactive Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-zinc-950/50 border border-zinc-900 rounded-2xl backdrop-blur-md">
        <div className="flex flex-wrap gap-4 items-center w-full">
          {showFormatSelector && (
            <div className="flex flex-col gap-1.5 min-w-[130px] flex-grow sm:flex-grow-0">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Format</span>
              <select
                value={activeSubType}
                onChange={(e) => updateFilters({ subType: e.target.value })}
                className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 cursor-pointer transition-colors duration-150"
              >
                <option value="">Semua Format</option>
                <option value="movie">Movie</option>
                <option value="tv">TV Series</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5 min-w-[140px] flex-grow sm:flex-grow-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Urutan</span>
            <select
              value={activeSortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 cursor-pointer transition-colors duration-150"
            >
              <option value="release_date">Terbaru</option>
              <option value="popularity">Terpopuler</option>
              <option value="title">Nama (A-Z)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[130px] flex-grow sm:flex-grow-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Bulan</span>
            <select
              value={activeMonth}
              onChange={(e) => updateFilters({ month: e.target.value })}
              className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 cursor-pointer transition-colors duration-150"
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[120px] flex-grow sm:flex-grow-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Tahun</span>
            <select
              value={activeYear}
              onChange={(e) => updateFilters({ year: e.target.value })}
              className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 cursor-pointer transition-colors duration-150"
            >
              {yearOptions.map(y => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {items.map((item) => (
          <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
        ))}
      </div>

      {/* Sentinel / Loading indicator */}
      {hasMore && (
        <div ref={sentinelRef} className="py-8 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 font-semibold">
              <span className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
              Memuat lebih banyak...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
