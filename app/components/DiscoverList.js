"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MovieCard from './MovieCard';

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
    const { type, genre, year, month, anime, drama, sortBy, subType } = searchParams;
    let apiEndpoint = 'discover/movie';
    
    if (type === 'tv') {
      apiEndpoint = 'discover/tv';
    } else if (type === 'movie') {
      apiEndpoint = 'discover/movie';
    } else if (anime === 'true') {
      apiEndpoint = subType === 'movie' ? 'discover/movie' : 'discover/tv';
    } else if (drama === 'true') {
      apiEndpoint = subType === 'tv' ? 'discover/tv' : 'discover/movie';
    } else if (genre) {
      apiEndpoint = 'discover/movie';
    }

    // Determine sorting parameter
    let tmdbSortBy = 'primary_release_date.desc';
    if (apiEndpoint === 'discover/tv') {
      tmdbSortBy = 'first_air_date.desc';
    }
    
    if (sortBy === 'popularity') {
      tmdbSortBy = 'popularity.desc';
    } else if (sortBy === 'title') {
      tmdbSortBy = apiEndpoint === 'discover/tv' ? 'original_name.asc' : 'original_title.asc';
    } else if (sortBy === 'release_date') {
      tmdbSortBy = apiEndpoint === 'discover/tv' ? 'first_air_date.desc' : 'primary_release_date.desc';
    }

    const query = new URLSearchParams({
      sort_by: tmdbSortBy,
      include_adult: 'false',
      language: 'id-ID',
      page: nextPage.toString(),
    });

    const today = new Date().toISOString().split('T')[0];

    if (apiEndpoint === 'discover/tv') {
      query.set('first_air_date.lte', today);
    } else {
      query.set('primary_release_date.lte', today);
    }

    if (anime === 'true') {
      query.set('with_genres', '16');
      query.set('with_original_language', 'ja');
    } else if (drama === 'true') {
      query.set('with_genres', '18');
    } else if (genre) {
      query.set('with_genres', genre);
    }

    // Date Filtering by Year and Month
    if (month) {
      const yearVal = year || new Date().getFullYear();
      const monthStr = String(month).padStart(2, '0');
      const startDate = `${yearVal}-${monthStr}-01`;
      const lastDay = new Date(parseInt(yearVal), parseInt(monthStr), 0).getDate();
      const endDate = `${yearVal}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
      
      if (apiEndpoint === 'discover/tv') {
        query.set('first_air_date.gte', startDate);
        query.set('first_air_date.lte', endDate);
      } else {
        query.set('primary_release_date.gte', startDate);
        query.set('primary_release_date.lte', endDate);
      }
    } else if (year) {
      if (apiEndpoint === 'discover/tv') {
        query.set('first_air_date_year', year);
      } else {
        query.set('primary_release_year', year);
      }
    }

    try {
      const res = await fetch(`/api/tmdb/${apiEndpoint}?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch next page");
      const data = await res.json();
      
      const newResults = data.results || [];
      const formattedItems = newResults.map(item => ({
        ...item,
        media_type: apiEndpoint === 'discover/tv' ? 'tv' : 'movie'
      }));

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

  const months = [
    { value: '', label: 'Semua Bulan' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const years = [
    { value: '', label: 'Semua Tahun' },
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' }
  ];

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
                className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-650 cursor-pointer transition-colors duration-150"
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
              className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-650 cursor-pointer transition-colors duration-150"
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
              className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-650 cursor-pointer transition-colors duration-150"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[120px] flex-grow sm:flex-grow-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Tahun</span>
            <select
              value={activeYear}
              onChange={(e) => updateFilters({ year: e.target.value })}
              className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-650 cursor-pointer transition-colors duration-150"
            >
              {years.map(y => (
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
              <span className="w-5 h-5 border-2 border-red-650 border-t-transparent rounded-full animate-spin"></span>
              Memuat lebih banyak...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
