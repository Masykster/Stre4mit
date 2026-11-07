"use client";

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Menu, ChevronDown } from 'lucide-react';
import { YEARS } from '../lib/discover';
import { DISCOVER_GENRES, getMatchScore } from '../lib/genres';

// Glass surface for the scrolled pill. Kept as inline styles so the effect does
// not depend on a custom class surviving the stylesheet pipeline.
const glassStyle = {
  backgroundColor: 'rgba(16, 16, 18, 0.55)',
  backgroundImage:
    'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 38%, rgba(255, 255, 255, 0.09) 100%)',
  WebkitBackdropFilter: 'blur(20px) saturate(170%)',
  backdropFilter: 'blur(20px) saturate(170%)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  boxShadow:
    '0 18px 40px -18px rgba(0, 0, 0, 0.85), 0 2px 8px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
};

const NAV_ITEMS = [
  { key: 'home', label: 'Beranda', href: '/' },
  { key: 'tv', label: 'Acara TV', href: '/discover?type=tv' },
  { key: 'movie', label: 'Film', href: '/discover?type=movie' },
  { key: 'anime', label: 'Anime', href: '/discover?anime=true' },
  { key: 'drama', label: 'Drama', href: '/discover?drama=true' },
  { key: 'watchlist', label: 'Daftar Saya', href: '/watchlist' },
];

function resolveActiveKey(pathname, searchParams) {
  if (pathname === '/') return 'home';
  if (pathname === '/watchlist') return 'watchlist';
  if (pathname === '/discover' && searchParams) {
    if (searchParams.get('anime') === 'true') return 'anime';
    if (searchParams.get('drama') === 'true') return 'drama';
    if (searchParams.get('type') === 'tv') return 'tv';
    if (searchParams.get('type') === 'movie') return 'movie';
  }
  return null;
}

function DesktopNavLinksInner({ pathname }) {
  const searchParams = useSearchParams();
  const activeKey = resolveActiveKey(pathname, searchParams);

  return (
    <nav className="hidden lg:flex items-center gap-5 text-[13px] tracking-wide">
      {NAV_ITEMS.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? 'text-white font-bold'
                : 'text-zinc-300/85 font-medium hover:text-zinc-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopNavLinksFallback({ pathname }) {
  const activeKey = resolveActiveKey(pathname, null);
  return (
    <nav className="hidden lg:flex items-center gap-5 text-[13px] tracking-wide">
      {NAV_ITEMS.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? 'text-white font-bold'
                : 'text-zinc-300/85 font-medium hover:text-zinc-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SearchResultsList({ loading, results, query, onSelect }) {
  if (loading) {
    return (
      <div className="p-5 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
        <span className="w-4 h-4 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"></span>
        Mencari judul...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-5 text-center text-xs text-zinc-500">
        Tidak ada judul yang cocok dengan &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-white/5">
        {results.map((item) => {
          const matchScore = getMatchScore(item.vote_average);
          const year = item.release_date
            ? item.release_date.split('-')[0]
            : item.first_air_date
            ? item.first_air_date.split('-')[0]
            : '';
          const thumbPath = item.backdrop_path || item.poster_path;

          return (
            <Link
              key={`${item.media_type}-${item.id}`}
              href={item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`}
              onClick={onSelect}
              className="flex items-center gap-3 p-2.5 hover:bg-[#2a2a2a] transition-colors duration-150 group"
            >
              <div className="relative w-20 aspect-video bg-[#141414] rounded-[3px] overflow-hidden flex-shrink-0">
                {thumbPath && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`https://image.tmdb.org/t/p/w300${thumbPath}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="text-xs sm:text-[13px] font-semibold text-zinc-100 group-hover:text-white truncate">
                  {item.title || item.name}
                </h4>
                <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                  {matchScore && (
                    <span className="text-emerald-400 font-bold">{matchScore}% Cocok</span>
                  )}
                  {year && <span>{year}</span>}
                  <span className="uppercase text-[9px] border border-zinc-600 px-1 py-px rounded-[2px] text-zinc-300 font-semibold">
                    {item.media_type === 'tv' ? 'Serial' : 'Film'}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {query.trim() && (
        <Link
          href={`/search?q=${encodeURIComponent(query.trim())}`}
          onClick={onSelect}
          className="block w-full py-2.5 px-3 text-center text-xs font-bold text-zinc-300 hover:text-white bg-[#141414] hover:bg-[#232323] border-t border-white/10 transition-colors"
        >
          Lihat semua hasil untuk &ldquo;{query.trim()}&rdquo; →
        </Link>
      )}
    </div>
  );
}

export default function NavigationBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (!query.trim()) setIsSearchExpanded(false);
    }
  };

  // Close dropdown & clear search on path change — adjusted during render
  // instead of inside an effect to avoid cascading re-renders
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (pathname !== '/search') {
      setQuery('');
      setIsSearchExpanded(false);
    }
    setResults([]);
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
  }

  // Click outside listener for desktop expandable search
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        if (!desktopInputRef.current?.value?.trim()) {
          setIsSearchExpanded(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Swap the transparent header for the floating glass pill once the page moves.
  // The first check runs inside rAF so no state is set directly in the effect.
  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 8);
    const frame = requestAnimationFrame(updateScrolled);
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScrolled);
    };
  }, []);

  // Mobile search modal: focus the field on open, close on Escape, and keep the
  // page behind the overlay from scrolling.
  useEffect(() => {
    if (!isMobileSearchOpen) return;

    mobileSearchRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileSearchOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileSearchOpen]);

  // Mobile navigation drawer: lock page scroll and allow closing with Escape.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Clear stale results immediately when the query is emptied — adjusted
  // during render instead of inside an effect to avoid cascading re-renders
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
    }
  }

  // Debounced search with abort support so stale responses can never
  // overwrite results for a newer query
  useEffect(() => {
    if (!query.trim()) return;

    let cancelled = false;
    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      if (pathname === '/search') {
        router.replace(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false });
        return;
      }

      setLoading(true);
      setIsOpen(true);
      try {
        const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}&include_adult=false`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!cancelled && data.results) {
          const filtered = data.results
            .filter((item) => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path) && !item.adult)
            .slice(0, 6);
          setResults(filtered);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Search failed:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query, pathname, router]);

  // Hide navbar completely on dedicated fullscreen cinema player routes
  if (pathname?.startsWith('/watch')) {
    return null;
  }

  const openDesktopSearch = () => {
    setIsSearchExpanded(true);
    requestAnimationFrame(() => {
      desktopInputRef.current?.focus();
    });
  };

  return (
    <>
      <header
        style={isScrolled ? glassStyle : undefined}
        className={`fixed z-50 mx-auto flex items-center justify-between transition-all duration-300 ease-out ${
          isScrolled
            ? 'top-3 left-3 right-3 md:left-6 md:right-6 max-w-6xl h-14 rounded-full px-5 md:px-7'
            : 'top-0 left-0 right-0 max-w-none h-16 px-4 md:px-8 bg-transparent'
        }`}
      >
        {/* Left: Brand & Netflix-style Links */}
        <div className="flex items-center gap-5 md:gap-8">
          <Link
            href="/"
            className="text-[#E50914] font-black text-xl md:text-2xl tracking-wider select-none active:scale-95 transition-transform duration-150"
          >
            STRE<span className="text-white">4</span>MIT
          </Link>

          <Suspense fallback={<DesktopNavLinksFallback pathname={pathname} />}>
            <DesktopNavLinksInner pathname={pathname} />
          </Suspense>

          {/* Tablet compact "Telusuri ▾" dropdown (Netflix medium-viewport pattern) */}
          <div className="relative group hidden md:block lg:hidden">
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-bold text-white py-2 focus:outline-none"
            >
              Telusuri
              <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50">
              <div className="w-48 bg-[#141414]/95 backdrop-blur-xl border border-white/15 border-t-2 border-t-white rounded-[4px] shadow-2xl py-2 text-center">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="block px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Expandable Netflix Search & Mobile Triggers */}
        <div className="flex items-center gap-2">
          {/* Expandable Search Bar (tablet & desktop) */}
          <div ref={searchRef} className="relative hidden sm:flex items-center">
            {isSearchExpanded || query ? (
              <div className="flex items-center w-52 md:w-64 h-9 px-3 rounded-full bg-black/75 border border-white/60 transition-all duration-200">
                <Search size={16} className="shrink-0 text-zinc-200 mr-2" />
                <input
                  ref={desktopInputRef}
                  type="text"
                  id="search-query"
                  name="q"
                  placeholder="Judul, film, serial..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  onFocus={() => query.trim() && pathname !== '/search' && setIsOpen(true)}
                  aria-label="Cari konten"
                  className="w-full bg-transparent text-xs md:text-[13px] text-white placeholder-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setIsOpen(false);
                    setIsSearchExpanded(false);
                  }}
                  className="ml-1 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Tutup pencarian"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openDesktopSearch}
                aria-label="Buka pencarian"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-100 hover:bg-white/10 transition-colors active:scale-95"
              >
                <Search size={18} />
              </button>
            )}

            {/* Dropdown Results Overlay */}
            {isOpen && pathname !== '/search' && (
              <div className="absolute right-0 top-full mt-2.5 w-[310px] sm:w-[360px] bg-[#181818] border border-white/15 rounded-md overflow-hidden shadow-2xl shadow-black z-50">
                <SearchResultsList
                  loading={loading}
                  results={results}
                  query={query}
                  onSelect={() => setIsOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchOpen(true);
              setIsMobileMenuOpen(false);
            }}
            aria-label="Buka pencarian"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-100 hover:bg-white/10 transition-transform active:scale-95 sm:hidden"
          >
            <Search size={18} />
          </button>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Buka menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-100 hover:bg-white/10 transition-transform active:scale-95 md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Tutup menu"
            className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-[#141414] px-5 pb-10 pt-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="select-none text-xl font-black tracking-wider text-[#E50914] transition-transform active:scale-95"
              >
                STRE<span className="text-white">4</span>MIT
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-zinc-200 transition-transform active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-6 flex flex-col">
              {NAV_ITEMS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`border-b border-white/5 py-3.5 text-sm font-semibold transition-colors ${
                    pathname === link.href ? 'text-white font-bold border-l-2 border-l-[#E50914] pl-3' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-7">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Telusuri Genre</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DISCOVER_GENRES.slice(0, 10).map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/discover?genre=${genre.id}&genreName=${encodeURIComponent(genre.name)}&view=grid`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-[4px] bg-[#232323] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-[#2f2f2f] hover:text-white"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tahun Rilis</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {YEARS.map((year) => (
                  <Link
                    key={year.value}
                    href={`/discover?year=${year.value}&view=grid`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-[4px] bg-[#232323] px-2 py-2 text-center text-xs font-medium text-zinc-300 transition-colors hover:bg-[#2f2f2f] hover:text-white"
                  >
                    {year.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile search modal */}
      {isMobileSearchOpen && (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label="Pencarian"
        >
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            aria-label="Tutup pencarian"
            className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-sm"
          />
          <div className="relative mx-3 mt-3 overflow-hidden rounded-lg border border-white/15 bg-[#181818] shadow-2xl">
            <div className="flex h-13 items-center gap-2 border-b border-white/10 px-3.5">
              <Search size={18} className="shrink-0 text-zinc-400" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Judul, film, acara TV..."
                aria-label="Cari konten"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-zinc-400 hover:text-white"
                  aria-label="Bersihkan pencarian"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {query.trim() ? (
                <SearchResultsList
                  loading={loading}
                  results={results}
                  query={query}
                  onSelect={() => setIsMobileSearchOpen(false)}
                />
              ) : (
                <p className="p-6 text-center text-xs text-zinc-500">
                  Ketik judul film atau acara TV yang ingin ditonton.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
