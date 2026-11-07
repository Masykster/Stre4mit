"use client";

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, ChevronDown, Bell } from 'lucide-react';
import { DISCOVER_GENRES, getMatchScore } from '../lib/genres';

const NAV_ITEMS = [
  { key: 'home', label: 'Beranda', href: '/' },
  { key: 'tv', label: 'Acara TV', href: '/discover?type=tv' },
  { key: 'movie', label: 'Film', href: '/discover?type=movie' },
  { key: 'latest', label: 'Baru & Populer', href: '/latest' },
  { key: 'anime', label: 'Anime', href: '/discover?anime=true' },
  { key: 'drama', label: 'Drama', href: '/discover?drama=true' },
  { key: 'watchlist', label: 'Daftar Saya', href: '/watchlist' },
  { key: 'languages', label: 'Telusuri Bahasa', href: '/languages' },
];

function resolveActiveKey(pathname, searchParams) {
  if (pathname === '/') return 'home';
  if (pathname === '/latest') return 'latest';
  if (pathname === '/languages') return 'languages';
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
    <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-[13px] xl:text-[14px]">
      {NAV_ITEMS.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? 'text-white font-bold cursor-default'
                : 'text-[#e5e5e5] font-normal hover:text-[#b3b3b3]'
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
    <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-[13px] xl:text-[14px]">
      {NAV_ITEMS.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? 'text-white font-bold cursor-default'
                : 'text-[#e5e5e5] font-normal hover:text-[#b3b3b3]'
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
              <div className="relative w-20 aspect-video bg-[#141414] rounded-[2px] overflow-hidden flex-shrink-0">
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
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);

  // Notification Bell ("Baru & Sedang Hangat") state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const [notifItems, setNotifItems] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifFetchedRef = useRef(false);

  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef(null);
  const browseRef = useRef(null);
  const notifRef = useRef(null);
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

  // Close menus on route change during render
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
    setIsBrowseOpen(false);
    setIsNotifOpen(false);
  }

  // Click outside listener for popovers
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        if (!desktopInputRef.current?.value?.trim()) {
          setIsSearchExpanded(false);
        }
      }
      if (browseRef.current && !browseRef.current.contains(event.target)) {
        setIsBrowseOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Netflix scroll transition: top gradient -> solid #141414
  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 10);
    const frame = requestAnimationFrame(updateScrolled);
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScrolled);
    };
  }, []);

  // Mobile search modal scroll lock
  useEffect(() => {
    if (!isMobileSearchOpen) return undefined;

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

  // Clear stale results immediately when query is emptied
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
    }
  }

  // Debounced search with abort support
  useEffect(() => {
    if (!query.trim()) return undefined;

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
        const res = await fetch(
          `/api/tmdb/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (!cancelled && data.results) {
          const filtered = data.results
            .filter(
              (item) =>
                (item.media_type === 'movie' || item.media_type === 'tv') &&
                (item.poster_path || item.backdrop_path) &&
                !item.adult
            )
            .slice(0, 6);
          setResults(filtered);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Search failed:', err);
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
    setIsNotifOpen(false);
    requestAnimationFrame(() => {
      desktopInputRef.current?.focus();
    });
  };

  const toggleNotifications = async () => {
    const nextOpen = !isNotifOpen;
    setIsNotifOpen(nextOpen);
    setHasUnreadNotif(false);

    if (nextOpen && !notifFetchedRef.current) {
      notifFetchedRef.current = true;
      setNotifLoading(true);
      try {
        const res = await fetch('/api/tmdb/trending/all/day?language=en-US');
        const data = await res.json();
        const items = (data?.results || [])
          .filter(
            (item) =>
              (item.media_type === 'movie' || item.media_type === 'tv') &&
              (item.backdrop_path || item.poster_path) &&
              !item.adult
          )
          .slice(0, 6);
        setNotifItems(items);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        notifFetchedRef.current = false;
      } finally {
        setNotifLoading(false);
      }
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex h-16 md:h-[68px] items-center justify-between px-4 md:px-12 transition-colors duration-500 ${
          isScrolled
            ? 'bg-[#141414] shadow-lg shadow-black/50'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
        }`}
      >
        {/* Left: Brand Wordmark & Netflix Navigation */}
        <div className="flex items-center gap-5 md:gap-9">
          <Link
            href="/"
            className="text-[#E50914] font-black text-xl sm:text-2xl md:text-[26px] tracking-wider select-none active:scale-95 transition-transform duration-150"
          >
            STRE<span className="text-white">4</span>MIT
          </Link>

          <Suspense fallback={<DesktopNavLinksFallback pathname={pathname} />}>
            <DesktopNavLinksInner pathname={pathname} />
          </Suspense>

          {/* Mobile & Tablet Netflix "Telusuri ▾" Dropdown (replaces side hamburger drawer) */}
          <div ref={browseRef} className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setIsBrowseOpen((prev) => !prev)}
              aria-expanded={isBrowseOpen}
              className="flex items-center gap-1 text-xs sm:text-[13px] font-bold text-white py-2 cursor-pointer focus:outline-none"
            >
              <span>Telusuri</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isBrowseOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isBrowseOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 sm:w-72 bg-black/95 backdrop-blur-md border border-white/15 border-t-2 border-t-white rounded-[2px] shadow-2xl z-50 overflow-hidden">
                {/* Small top caret indicator */}
                <nav className="flex flex-col py-1.5 text-center border-b border-white/10">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setIsBrowseOpen(false)}
                      className={`px-4 py-2.5 text-[13px] transition-colors ${
                        pathname === item.href
                          ? 'text-white font-bold bg-white/5'
                          : 'text-[#b3b3b3] font-medium hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="p-3 bg-[#141414]/90">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 text-center">
                    Genre Populer
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DISCOVER_GENRES.slice(0, 6).map((g) => (
                      <Link
                        key={g.id}
                        href={`/discover?genre=${g.id}&genreName=${encodeURIComponent(g.name)}&view=grid`}
                        onClick={() => setIsBrowseOpen(false)}
                        className="text-center py-1.5 px-2 rounded-[2px] bg-white/5 hover:bg-white/15 text-[11px] text-zinc-300 hover:text-white transition-colors truncate"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Crisp Rectangular Expandable Search & Notification Bell */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Desktop & Tablet Rectangular Netflix Search Box */}
          <div ref={searchRef} className="relative hidden sm:flex items-center">
            <div
              className={`flex items-center h-9 overflow-hidden transition-all duration-300 ease-out ${
                isSearchExpanded || query
                  ? 'w-56 md:w-68 px-2.5 bg-black/85 border border-white/85 rounded-[2px]'
                  : 'w-9 justify-center bg-transparent border border-transparent'
              }`}
            >
              <button
                type="button"
                onClick={openDesktopSearch}
                aria-label="Buka pencarian"
                className="flex items-center justify-center text-white hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
              >
                <Search size={19} strokeWidth={2.2} />
              </button>

              {(isSearchExpanded || query) && (
                <>
                  <input
                    ref={desktopInputRef}
                    type="text"
                    id="search-query"
                    name="q"
                    placeholder="Judul, film, genre..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    onFocus={() => query.trim() && pathname !== '/search' && setIsOpen(true)}
                    aria-label="Cari konten"
                    className="w-full pl-2.5 pr-1 bg-transparent text-xs md:text-[13px] text-white placeholder-zinc-400 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setIsOpen(false);
                        desktopInputRef.current?.focus();
                      }}
                      className="text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                      aria-label="Bersihkan pencarian"
                    >
                      <X size={16} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {isOpen && pathname !== '/search' && (
              <div className="absolute right-0 top-full mt-2 w-[310px] sm:w-[360px] bg-black/95 border border-white/15 border-t-2 border-t-white rounded-[2px] overflow-hidden shadow-2xl shadow-black z-50">
                <SearchResultsList
                  loading={loading}
                  results={results}
                  query={query}
                  onSelect={() => setIsOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Mobile Search Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchOpen(true);
              setIsBrowseOpen(false);
              setIsNotifOpen(false);
            }}
            aria-label="Buka pencarian"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-white hover:text-zinc-300 transition-transform active:scale-95 sm:hidden"
          >
            <Search size={19} strokeWidth={2.2} />
          </button>

          {/* Netflix Notification Bell ("Baru & Sedang Hangat") */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              aria-label="Notifikasi tayangan terbaru"
              title="Baru & Sedang Hangat"
              className="relative flex h-9 w-9 items-center justify-center text-white hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <Bell size={19} strokeWidth={2.1} />
              {hasUnreadNotif && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E50914] ring-2 ring-[#141414]" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[295px] sm:w-[365px] max-h-[70vh] overflow-y-auto bg-black/95 backdrop-blur-md border border-white/15 border-t-2 border-t-white rounded-[2px] shadow-2xl z-50">
                <div className="px-4 py-2.5 border-b border-white/10">
                  <p className="text-xs font-bold text-white">Baru & Sedang Hangat Hari Ini</p>
                </div>

                {notifLoading ? (
                  <div className="p-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                    Memuat rilis terbaru...
                  </div>
                ) : notifItems.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {notifItems.map((item) => {
                      const title = item.title || item.name;
                      const year = (item.release_date || item.first_air_date || '').split('-')[0];
                      const thumb = item.backdrop_path || item.poster_path;
                      const href = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;

                      return (
                        <Link
                          key={`notif-${item.media_type}-${item.id}`}
                          href={href}
                          onClick={() => setIsNotifOpen(false)}
                          className="flex items-center gap-3.5 p-3 hover:bg-white/10 transition-colors group"
                        >
                          <div className="relative w-24 aspect-video bg-[#181818] rounded-[2px] overflow-hidden flex-shrink-0">
                            {thumb && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={`https://image.tmdb.org/t/p/w300${thumb}`}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-grow space-y-0.5">
                            <p className="text-[11px] font-bold text-[#E50914] uppercase tracking-wide">
                              Trending Sekarang
                            </p>
                            <p className="text-xs sm:text-[13px] font-semibold text-zinc-100 group-hover:text-white line-clamp-1">
                              {title}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              {item.media_type === 'tv' ? 'Acara TV' : 'Film'}
                              {year ? ` • ${year}` : ''}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="p-5 text-center text-xs text-zinc-500">
                    Belum ada pembaruan tayangan terbaru.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
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
            className="absolute inset-0 h-full w-full bg-black/80 backdrop-blur-xs"
          />
          <div className="relative mx-3 mt-3 overflow-hidden rounded-[4px] border border-white/25 bg-[#141414] shadow-2xl">
            <div className="flex h-12 items-center gap-2 border-b border-white/10 px-3.5 bg-black">
              <Search size={18} className="shrink-0 text-zinc-300" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Judul, film, genre..."
                aria-label="Cari konten"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (query) setQuery('');
                  else setIsMobileSearchOpen(false);
                }}
                className="p-1 text-zinc-400 hover:text-white"
                aria-label="Tutup atau bersihkan pencarian"
              >
                <X size={18} />
              </button>
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
