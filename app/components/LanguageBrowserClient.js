"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MovieCard from './MovieCard';

export const NETFLIX_LANGUAGES = [
  { code: 'ko', label: 'Bahasa Korea' },
  { code: 'ja', label: 'Bahasa Jepang' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'Bahasa Inggris' },
  { code: 'zh', label: 'Bahasa Mandarin' },
  { code: 'th', label: 'Bahasa Thailand' },
  { code: 'hi', label: 'Bahasa Hindi' },
  { code: 'es', label: 'Bahasa Spanyol' },
  { code: 'fr', label: 'Bahasa Prancis' },
  { code: 'de', label: 'Bahasa Jerman' },
  { code: 'tr', label: 'Bahasa Turki' },
  { code: 'ar', label: 'Bahasa Arab' },
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Saran untuk Anda' },
  { value: 'newest', label: 'Tahun Rilis Terbaru' },
  { value: 'rating', label: 'Rating Tertinggi' },
  { value: 'az', label: 'Judul (A–Z)' },
  { value: 'za', label: 'Judul (Z–A)' },
];

function sortClientItems(list, sortMode) {
  if (sortMode === 'az') {
    return [...list].sort((a, b) =>
      (a.title || a.name || '').localeCompare(b.title || b.name || '')
    );
  }
  if (sortMode === 'za') {
    return [...list].sort((a, b) =>
      (b.title || b.name || '').localeCompare(a.title || a.name || '')
    );
  }
  return list;
}

function buildLanguageParams(mediaType, lang, sortMode, pageNum) {
  const today = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    with_original_language: lang,
    page: String(pageNum),
    language: 'en-US',
    include_adult: 'false',
  });

  if (sortMode === 'newest') {
    params.set(
      'sort_by',
      mediaType === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc'
    );
    params.set(mediaType === 'tv' ? 'first_air_date.lte' : 'primary_release_date.lte', today);
    params.set('vote_count.gte', '3');
  } else if (sortMode === 'rating') {
    params.set('sort_by', 'vote_average.desc');
    params.set('vote_count.gte', lang === 'id' ? '10' : '40');
  } else {
    params.set('sort_by', 'popularity.desc');
  }

  return params;
}

export default function LanguageBrowserClient({
  initialItems = [],
  initialLang = 'ko',
  initialType = 'all',
  initialSort = 'popularity',
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState(initialLang);
  const [mediaType, setMediaType] = useState(initialType);
  const [sortMode, setSortMode] = useState(initialSort);
  const [items, setItems] = useState(() => sortClientItems(initialItems, initialSort));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialItems.length >= 10);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef(null);

  const fetchBatch = useCallback(async (nextLang, nextType, nextSort, pageNum, append = false) => {
    setLoading(true);
    try {
      const typesToFetch = nextType === 'all' ? ['movie', 'tv'] : [nextType];
      const responses = await Promise.all(
        typesToFetch.map(async (t) => {
          const q = buildLanguageParams(t, nextLang, nextSort, pageNum);
          const res = await fetch(`/api/tmdb/discover/${t}?${q.toString()}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.results || [])
            .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
            .map((item) => ({ ...item, media_type: t }));
        })
      );

      const combined = responses.flat().sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      setItems((prev) => {
        const base = append ? [...prev, ...combined] : combined;
        const seen = new Set();
        const deduped = base.filter((item) => {
          const key = `${item.media_type}-${item.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return sortClientItems(deduped, nextSort);
      });
      setHasMore(combined.length >= 8 && pageNum < 15);
    } catch (err) {
      console.error('Failed to browse by language:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = (nextLang, nextType, nextSort) => {
    setLang(nextLang);
    setMediaType(nextType);
    setSortMode(nextSort);
    setPage(1);

    const urlParams = new URLSearchParams(searchParams?.toString() || '');
    urlParams.set('lang', nextLang);
    urlParams.set('type', nextType);
    urlParams.set('sort', nextSort);
    router.replace(`/languages?${urlParams.toString()}`, { scroll: false });

    fetchBatch(nextLang, nextType, nextSort, 1, false);
  };

  // Infinite Scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchBatch(lang, mediaType, sortMode, nextPage, true);
        }
      },
      { rootMargin: '320px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, lang, mediaType, sortMode, fetchBatch]);

  const currentLangLabel =
    NETFLIX_LANGUAGES.find((l) => l.code === lang)?.label || 'Bahasa Pilihan';

  return (
    <div className="min-h-screen bg-[#141414] text-zinc-100 pt-16 md:pt-[68px] pb-24">
      {/* Sticky Netflix Browse-by-Languages Control Header */}
      <div className="sticky top-16 md:top-[68px] z-30 bg-[#141414]/95 backdrop-blur-md border-b border-white/5 px-4 md:px-12 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-white tracking-tight">
              Telusuri menurut Bahasa
            </h1>
            <span className="hidden sm:inline text-xs font-semibold text-zinc-400">
              {currentLangLabel}
            </span>
          </div>

          {/* 3 Authentic Netflix Black Rectangular Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="text-zinc-400 font-medium hidden xl:inline">Pilih Preferensi</span>

            <select
              aria-label="Jenis tayangan"
              value={mediaType}
              onChange={(e) => applyFilters(lang, e.target.value, sortMode)}
              className="h-9 px-3 bg-black hover:bg-[#1a1a1a] border border-white/75 rounded-[2px] text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Tayangan</option>
              <option value="tv">Acara TV</option>
              <option value="movie">Film</option>
            </select>

            <select
              aria-label="Pilih bahasa asli"
              value={lang}
              onChange={(e) => applyFilters(e.target.value, mediaType, sortMode)}
              className="h-9 px-3 bg-black hover:bg-[#1a1a1a] border border-white/75 rounded-[2px] text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {NETFLIX_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-medium hidden md:inline">Urutkan menurut</span>
              <select
                aria-label="Urutkan menurut"
                value={sortMode}
                onChange={(e) => applyFilters(lang, mediaType, e.target.value)}
                className="h-9 px-3 bg-black hover:bg-[#1a1a1a] border border-white/75 rounded-[2px] text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick 1-Click Language Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {NETFLIX_LANGUAGES.slice(0, 8).map((l) => {
            const active = lang === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => applyFilters(l.code, mediaType, sortMode)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-black'
                    : 'bg-[#242424] text-zinc-300 hover:bg-[#323232] hover:text-white'
                }`}
              >
                {l.label.replace('Bahasa ', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      <div className="px-4 md:px-12 pt-6">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {items.map((item) => (
              <MovieCard key={`${item.media_type}-${item.id}`} item={item} />
            ))}
          </div>
        ) : !loading ? (
          <div className="py-24 text-center text-sm text-zinc-400">
            Tidak ada tayangan yang cocok untuk pilihan bahasa ini.
          </div>
        ) : null}

        {/* Sentinel & Skeleton Loader */}
        <div ref={sentinelRef} className="pt-8 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-400">
              <span className="h-4 w-4 rounded-full border-2 border-[#E50914] border-t-transparent animate-spin" />
              <span>Memuat tayangan {currentLangLabel}...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
