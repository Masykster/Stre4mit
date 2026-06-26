"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, X } from 'lucide-react';

export default function NavigationBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchRef = useRef(null);

  // Close dropdown on path change
  useEffect(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, [pathname]);

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

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const res = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          const filtered = data.results
            .filter((item) => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path))
            .slice(0, 6);
          setResults(filtered);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-4 md:px-8 flex items-center justify-between">
      {/* Brand & Nav Links */}
      <div className="flex items-center gap-6 md:gap-10">
        <Link href="/" className="text-red-600 font-extrabold text-xl md:text-2xl tracking-wider select-none active:scale-95 transition-transform duration-150">
          STRE<span className="text-white">4</span>MIT
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link 
            href="/" 
            className={`transition-colors duration-150 hover:text-zinc-50 ${pathname === '/' ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
          >
            Beranda
          </Link>
          
          {/* Desktop & Tablet Filters (ponytail: responsive tailwind classes handle visibility changes without JS overhead) */}
          <Link href="#" className="hidden lg:inline transition-colors duration-150 hover:text-zinc-50 text-zinc-400">
            Anime
          </Link>
          <Link href="#" className="hidden md:inline transition-colors duration-150 hover:text-zinc-50 text-zinc-400">
            Movies
          </Link>
          <Link href="#" className="hidden lg:inline transition-colors duration-150 hover:text-zinc-50 text-zinc-400">
            TV Show
          </Link>
          <Link href="#" className="hidden lg:inline transition-colors duration-150 hover:text-zinc-50 text-zinc-400">
            Drama
          </Link>
          <Link href="#" className="hidden md:inline transition-colors duration-150 hover:text-zinc-50 text-zinc-400">
            Genre
          </Link>
          <Link href="#" className="hidden md:inline transition-colors duration-150 hover:text-zinc-50 text-zinc-400">
            Years
          </Link>

          <Link 
            href="/watchlist" 
            className={`transition-colors duration-150 hover:text-zinc-50 flex items-center gap-1.5 ${pathname === '/watchlist' ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}
          >
            <Heart size={16} />
            <span className="hidden sm:inline">Watchlist</span>
          </Link>
        </nav>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="relative w-48 sm:w-64">
        <div className="relative">
          <input
            type="text"
            id="search-query"
            name="q"
            placeholder="Cari film atau TV series..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setIsOpen(true)}
            aria-label="Cari konten"
            className="w-full h-10 pl-10 pr-8 bg-zinc-900/80 text-zinc-100 rounded-full border border-zinc-800 text-sm focus:outline-none focus:border-red-650 focus:bg-zinc-900 transition-colors duration-150 placeholder-zinc-550"
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
            {loading ? (
              <div className="p-4 text-center text-sm text-zinc-400 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                Mencari...
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-zinc-900">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`}
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
            ) : (
              <div className="p-4 text-center text-sm text-zinc-500">
                Tidak ada hasil ditemukan
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
