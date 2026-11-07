"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, AlignLeft, LayoutGrid } from 'lucide-react';
import { DISCOVER_GENRES } from '../lib/genres';

export default function DiscoverHeaderBar({
  categoryLabel,
  baseCategoryHref,
  activeGenreName,
  isBrowseMode,
  browseHref,
  gridHref,
  searchParams,
}) {
  const [genreOpen, setGenreOpen] = useState(false);
  const [isSubScrolled, setIsSubScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setGenreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Shrink title & turn sub-header solid #141414 once scrolled beneath the Netflix navbar
  useEffect(() => {
    const updateScroll = () => setIsSubScrolled(window.scrollY > 24);
    const frame = requestAnimationFrame(updateScroll);
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  const isTV =
    searchParams?.type === 'tv' ||
    (searchParams?.anime === 'true' && searchParams?.subType !== 'movie');

  const buildGenreHref = (genre) => {
    const params = new URLSearchParams();
    if (searchParams?.type) params.set('type', searchParams.type);
    if (searchParams?.anime === 'true') params.set('anime', 'true');
    if (searchParams?.drama === 'true') params.set('drama', 'true');
    const resolvedGenreId = isTV ? genre.tvId : genre.id;
    params.set('genre', String(resolvedGenreId));
    params.set('genreName', genre.name);
    params.set('view', 'grid');
    return `/discover?${params.toString()}`;
  };

  return (
    <div
      className={`sticky top-16 md:top-[68px] z-40 flex h-14 items-center justify-between gap-3 px-4 md:px-12 transition-all duration-300 ${
        isSubScrolled
          ? 'bg-[#141414]/95 backdrop-blur-xs shadow-md shadow-black/40'
          : 'bg-transparent'
      }`}
    >
      {/* Left: Netflix Category Breadcrumb / Shrinking Sticky Title + Genre Selector */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <div className="flex items-center gap-2">
          {activeGenreName && baseCategoryHref ? (
            <>
              <Link
                href={baseCategoryHref}
                className="text-sm sm:text-base font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                {categoryLabel} &rsaquo;
              </Link>
              <h1
                className={`font-black tracking-tight text-white drop-shadow transition-all duration-300 ${
                  isSubScrolled ? 'text-lg sm:text-xl md:text-2xl' : 'text-2xl sm:text-3xl md:text-4xl'
                }`}
              >
                {activeGenreName}
              </h1>
            </>
          ) : (
            <h1
              className={`font-black tracking-tight text-white drop-shadow transition-all duration-300 ${
                isSubScrolled ? 'text-lg sm:text-xl md:text-2xl' : 'text-2xl sm:text-3xl md:text-4xl'
              }`}
            >
              {categoryLabel}
            </h1>
          )}
        </div>

        {/* Netflix Crisp Rectangular Genre Dropdown */}
        {searchParams?.anime !== 'true' && (
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setGenreOpen((prev) => !prev)}
              className="flex items-center gap-4 bg-black/80 hover:bg-black/95 border border-white/75 text-white text-xs sm:text-[13px] font-bold px-3 py-1.5 rounded-[2px] backdrop-blur-xs transition-colors cursor-pointer"
            >
              <span>{activeGenreName || 'Genre'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${genreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {genreOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-[280px] sm:w-[360px] bg-black/95 border border-white/20 p-3 rounded-[2px] shadow-2xl z-50 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2">
                {DISCOVER_GENRES.map((g) => (
                  <Link
                    key={g.name}
                    href={buildGenreHref(g)}
                    onClick={() => setGenreOpen(false)}
                    className="text-xs text-zinc-300 hover:text-white hover:underline py-0.5 truncate"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Segmented Netflix View Toggle (Rows vs Filter Grid) */}
      <div className="inline-flex items-center border border-white/50 bg-black/65 backdrop-blur-xs rounded-[2px] overflow-hidden">
        <Link
          href={browseHref}
          title="Tampilan Baris ala Netflix"
          aria-label="Tampilan Baris"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
            isBrowseMode
              ? 'bg-white/15 text-white border-r border-white/50'
              : 'text-zinc-400 hover:text-white border-r border-white/20'
          }`}
        >
          <AlignLeft size={15} />
          <span className="hidden sm:inline">Baris</span>
        </Link>
        <Link
          href={gridHref}
          title="Tampilan Grid & Filter Lengkap"
          aria-label="Tampilan Grid"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
            !isBrowseMode ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <LayoutGrid size={15} />
          <span className="hidden sm:inline">Grid</span>
        </Link>
      </div>
    </div>
  );
}
