"use client";

import { useState, useEffect, useRef } from 'react';
import MovieCard from './MovieCard';

export default function DiscoverList({ initialItems, searchParams }) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);
  const sentinelRef = useRef(null);

  const loadMoreItems = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;
    const { type, genre, year, anime, drama } = searchParams;
    let apiEndpoint = 'discover/movie';
    const query = new URLSearchParams({
      sort_by: type === 'tv' || anime === 'true' ? 'first_air_date.desc' : 'primary_release_date.desc',
      include_adult: 'false',
      language: 'id-ID',
      page: nextPage.toString(),
    });

    const today = new Date().toISOString().split('T')[0];

    if (type === 'tv') {
      apiEndpoint = 'discover/tv';
      query.set('first_air_date.lte', today);
    } else {
      query.set('primary_release_date.lte', today);
    }

    if (anime === 'true') {
      apiEndpoint = 'discover/tv';
      query.set('with_genres', '16');
      query.set('with_original_language', 'ja');
      query.set('first_air_date.lte', today);
    } else if (drama === 'true') {
      apiEndpoint = 'discover/movie';
      query.set('with_genres', '18');
    } else {
      if (genre) {
        query.set('with_genres', genre);
      }
      if (year) {
        if (apiEndpoint === 'discover/tv') {
          query.set('first_air_date_year', year);
        } else {
          query.set('primary_release_year', year);
        }
      }
    }

    try {
      const res = await fetch(`/api/tmdb/${apiEndpoint}?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch next page");
      const data = await res.json();
      
      const newResults = data.results || [];
      const formattedItems = newResults.map(item => ({
        ...item,
        media_type: type || (apiEndpoint === 'discover/tv' ? 'tv' : 'movie')
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

  return (
    <div className="space-y-8">
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
