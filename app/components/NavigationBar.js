"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Heart, X, Menu } from 'lucide-react';
import { YEARS } from '../lib/discover';

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

const MOBILE_NAV_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Anime', href: '/discover?anime=true' },
  { label: 'Movies', href: '/discover?type=movie' },
  { label: 'TV Show', href: '/discover?type=tv' },
  { label: 'Drama', href: '/discover?drama=true' },
  { label: 'Watchlist', href: '/watchlist' },
];

const MOBILE_GENRES = [
  { id: 28, name: 'Aksi' },
  { id: 35, name: 'Komedi' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horor' },
  { id: 10749, name: 'Romantis' },
  { id: 878, name: 'Sci-Fi' },
  { id: 16, name: 'Animasi' },
  { id: 9648, name: 'Misteri' },
];

function SearchResultsList({ loading, results, onSelect }) {
  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-zinc-400 flex items-center justify-center gap-2">
        <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
        Mencari...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-zinc-500">
        Tidak ada hasil ditemukan
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-900">
      {results.map((item) => (
        <Link
          key={item.id}
          href={item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`}
          onClick={onSelect}
          className="flex items-center gap-3 p-3 hover:bg-zinc-900 transition-colors duration-150 group"
        >
          <div className="relative w-10 h-14 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://image.tmdb.org/t/p/w92${item.poster_path || item.backdrop_path}`}
              alt={item.title || item.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-red-500 transition-colors truncate">
              {item.title || item.name}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span className="uppercase text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-bold">
                {item.media_type === 'tv' ? 'TV' : 'Movie'}
              </span>
              <span>
                {item.release_date ? item.release_date.split('-')[0] : item.first_air_date ? item.first_air_date.split('-')[0] : '-'}
              </span>
              {item.vote_average > 0 && (
                <span className="text-yellow-500 font-bold">
                  ★ {item.vote_average.toFixed(1)}
                </span>
              )}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function NavigationBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // Close dropdown & clear search on path change — adjusted during render
  // instead of inside an effect to avoid cascading re-renders
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
  }

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
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
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query]);

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
      {/* Brand & Nav Links */}
      <div className="flex items-center gap-6 md:gap-10">
        <Link href="/" className="text-red-600 font-extrabold text-xl md:text-2xl tracking-wider select-none active:scale-95 transition-transform duration-150">
          STRE<span className="text-white">4</span>MIT
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link 
            href="/" 
            className={`hidden md:inline transition-colors duration-150 hover:text-zinc-50 ${pathname === '/' ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
          >
            Beranda
          </Link>
          
          {/* Desktop & Tablet Filters (ponytail: native tailwind responsive classes & hover dropdown groups) */}
          
          {/* Anime Dropdown */}
          <div className="relative group hidden lg:block">
            <Link 
              href="/discover?anime=true" 
              className={`transition-colors duration-150 hover:text-zinc-50 text-sm font-medium h-16 flex items-center ${pathname.includes('anime=true') ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
            >
              Anime
            </Link>
            <div className="absolute left-0 mt-0 w-48 bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl hidden group-hover:block z-50 p-2">
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 mb-1">Urutan</div>
              <Link href="/discover?anime=true&sortBy=popularity" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terpopuler</Link>
              <Link href="/discover?anime=true&sortBy=release_date" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terbaru</Link>
              <Link href="/discover?anime=true&sortBy=title" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Nama (A-Z)</Link>
              
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 my-1">Format</div>
              <Link href="/discover?anime=true&subType=movie" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Anime Movie</Link>
              <Link href="/discover?anime=true&subType=tv" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Anime Series</Link>
              
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 my-1">Tahun</div>
              <div className="grid grid-cols-3 gap-1 px-2 py-1">
                {YEARS.slice(0, 3).map((y) => (
                  <Link key={y.value} href={`/discover?anime=true&year=${y.value}`} className="text-center py-1 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">{y.label}</Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Movies Dropdown */}
          <div className="relative group hidden md:block">
            <Link 
              href="/discover?type=movie" 
              className={`transition-colors duration-150 hover:text-zinc-50 text-sm font-medium h-16 flex items-center ${pathname.includes('type=movie') ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
            >
              Movies
            </Link>
            <div className="absolute left-0 mt-0 w-48 bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl hidden group-hover:block z-50 p-2">
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 mb-1">Urutan</div>
              <Link href="/discover?type=movie&sortBy=popularity" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terpopuler</Link>
              <Link href="/discover?type=movie&sortBy=release_date" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terbaru</Link>
              <Link href="/discover?type=movie&sortBy=title" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Nama (A-Z)</Link>
              
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 my-1">Tahun</div>
              <div className="grid grid-cols-3 gap-1 px-2 py-1">
                {YEARS.slice(0, 3).map((y) => (
                  <Link key={y.value} href={`/discover?type=movie&year=${y.value}`} className="text-center py-1 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">{y.label}</Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* TV Show Dropdown */}
          <div className="relative group hidden lg:block">
            <Link 
              href="/discover?type=tv" 
              className={`transition-colors duration-150 hover:text-zinc-50 text-sm font-medium h-16 flex items-center ${pathname.includes('type=tv') && !pathname.includes('anime=true') ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
            >
              TV Show
            </Link>
            <div className="absolute left-0 mt-0 w-48 bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl hidden group-hover:block z-50 p-2">
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 mb-1">Urutan</div>
              <Link href="/discover?type=tv&sortBy=popularity" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terpopuler</Link>
              <Link href="/discover?type=tv&sortBy=release_date" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terbaru</Link>
              <Link href="/discover?type=tv&sortBy=title" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Nama (A-Z)</Link>
              
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 my-1">Tahun</div>
              <div className="grid grid-cols-3 gap-1 px-2 py-1">
                {YEARS.slice(0, 3).map((y) => (
                  <Link key={y.value} href={`/discover?type=tv&year=${y.value}`} className="text-center py-1 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">{y.label}</Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Drama Dropdown */}
          <div className="relative group hidden lg:block">
            <Link 
              href="/discover?drama=true" 
              className={`transition-colors duration-150 hover:text-zinc-50 text-sm font-medium h-16 flex items-center ${pathname.includes('drama=true') ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
            >
              Drama
            </Link>
            <div className="absolute left-0 mt-0 w-48 bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl hidden group-hover:block z-50 p-2">
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 mb-1">Urutan</div>
              <Link href="/discover?drama=true&sortBy=popularity" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terpopuler</Link>
              <Link href="/discover?drama=true&sortBy=release_date" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Terbaru</Link>
              <Link href="/discover?drama=true&sortBy=title" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Nama (A-Z)</Link>
              
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 my-1">Format</div>
              <Link href="/discover?drama=true&subType=movie" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Drama Movie</Link>
              <Link href="/discover?drama=true&subType=tv" className="block px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">Drama Series</Link>
              
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 border-b border-zinc-900/50 my-1">Tahun</div>
              <div className="grid grid-cols-3 gap-1 px-2 py-1">
                {YEARS.slice(0, 3).map((y) => (
                  <Link key={y.value} href={`/discover?drama=true&year=${y.value}`} className="text-center py-1 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 rounded">{y.label}</Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Genre Dropdown */}
          <div className="relative group hidden md:block">
            <button className="transition-colors duration-150 hover:text-zinc-50 text-zinc-400 text-sm font-medium h-16 flex items-center gap-1 focus:outline-none">
              Genre
            </button>
            <div className="absolute left-0 mt-0 w-40 bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl hidden group-hover:block z-50">
              <div className="py-1">
                <Link href="/discover?genre=28&genreName=Aksi" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Aksi</Link>
                <Link href="/discover?genre=35&genreName=Komedi" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Komedi</Link>
                <Link href="/discover?genre=18&genreName=Drama" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Drama</Link>
                <Link href="/discover?genre=27&genreName=Horor" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Horor</Link>
                <Link href="/discover?genre=10749&genreName=Romantis" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Romantis</Link>
                <Link href="/discover?genre=878&genreName=Sci-Fi" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Sci-Fi</Link>
                <Link href="/discover?genre=16&genreName=Animasi" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Animasi</Link>
                <Link href="/discover?genre=9648&genreName=Misteri" className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">Misteri</Link>
              </div>
            </div>
          </div>

          {/* Years Dropdown */}
          <div className="relative group hidden md:block">
            <button className="transition-colors duration-150 hover:text-zinc-50 text-zinc-400 text-sm font-medium h-16 flex items-center gap-1 focus:outline-none">
              Years
            </button>
            <div className="absolute left-0 mt-0 w-32 bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl hidden group-hover:block z-50">
              <div className="py-1">
                {YEARS.map((y) => (
                  <Link key={y.value} href={`/discover?year=${y.value}`} className="block px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900">{y.label}</Link>
                ))}
              </div>
            </div>
          </div>

          <Link 
            href="/watchlist" 
            className={`transition-colors duration-150 hover:text-zinc-50 flex items-center gap-1.5 ${pathname === '/watchlist' ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
          >
            <Heart size={16} />
            <span className="hidden sm:inline">Watchlist</span>
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
      {/* Search Bar (tablet & desktop) */}
      <div ref={searchRef} className="relative hidden w-48 sm:block sm:w-64">
        <div className="relative">
          <input
            type="text"
            id="search-query"
            name="q"
            placeholder="Cari film atau TV series..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            onFocus={() => query.trim() && setIsOpen(true)}
            aria-label="Cari konten"
            className="w-full h-10 pl-10 pr-8 bg-zinc-900/80 text-zinc-100 rounded-full border border-zinc-800 text-sm focus:outline-none focus:border-red-600 focus:bg-zinc-900 transition-colors duration-150 placeholder-zinc-500"
          />
          <Search size={18} className="absolute left-3.5 top-2.5 text-zinc-500" />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-200"
              aria-label="Bersihkan pencarian"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dropdown Results Overlay */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-[280px] sm:w-[360px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50">
            <SearchResultsList
              loading={loading}
              results={results}
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300 transition-transform active:scale-95 sm:hidden"
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300 transition-transform active:scale-95 md:hidden"
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
          className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
        />
        <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950 px-5 pb-10 pt-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="select-none text-xl font-extrabold tracking-wider text-red-600 transition-transform active:scale-95"
            >
              STRE<span className="text-white">4</span>MIT
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Tutup menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition-transform active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="mt-6 flex flex-col">
            {MOBILE_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`border-b border-zinc-900 py-3.5 text-sm font-semibold transition-colors ${
                  pathname === link.href ? 'text-red-500' : 'text-zinc-200 hover:text-red-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Genre</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {MOBILE_GENRES.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/discover?genre=${genre.id}&genreName=${encodeURIComponent(genre.name)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-red-900 hover:text-red-400"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tahun</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {YEARS.map((year) => (
                <Link
                  key={year.value}
                  href={`/discover?year=${year.value}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-center text-xs font-medium text-zinc-300 transition-colors hover:border-red-900 hover:text-red-400"
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
          className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
        />
        <div className="relative mx-3 mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl">
          <div className="flex h-14 items-center gap-2 border-b border-zinc-900 px-3">
            <Search size={18} className="shrink-0 text-zinc-500" />
            <input
              ref={mobileSearchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Cari film atau TV series..."
              aria-label="Cari konten"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-zinc-500 hover:text-zinc-200"
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
                onSelect={() => setIsMobileSearchOpen(false)}
              />
            ) : (
              <p className="p-6 text-center text-sm text-zinc-500">
                Ketik judul film atau TV series.
              </p>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
