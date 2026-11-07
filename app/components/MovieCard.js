"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import WatchlistButton from './WatchlistButton';
import { useApp } from '../context/AppContext';
import { getGenreNames, getMatchScore, getMaturityBadge } from '../lib/genres';

// Evaluated once at module load so render stays 100% pure under React 19 rules
const TODAY_START_MS = new Date().setHours(0, 0, 0, 0);
const cardTrailerCache = new Map();

function getReleaseStatus(dateStr) {
  if (!dateStr) return null;
  const parsed = Date.parse(dateStr);
  if (Number.isNaN(parsed)) return null;
  const diffDays = Math.round((TODAY_START_MS - parsed) / 86400000);
  if (diffDays < 0) return 'Segera Hadir';
  if (diffDays <= 45) return 'Baru Ditambahkan';
  return null;
}

export default function MovieCard({
  item,
  priority = false,
  variant = 'landscape',
  hideTitle = false,
  isTop10 = false,
  replaceNavigation = false,
}) {
  const { history } = useApp();
  const cardRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const previewIframeRef = useRef(null);

  const [previewRect, setPreviewRect] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const id = item.id;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name || 'Tanpa Judul';
  const releaseDate = item.release_date || item.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const detailHref = `/${mediaType}/${id}`;

  // Resume from last watched season/episode if available for TV shows
  const savedHistory =
    mediaType === 'tv'
      ? history.find((h) => Number(h.id) === Number(id) && h.media_type === 'tv')
      : null;
  const watchHref =
    mediaType === 'tv'
      ? `/watch/tv/${id}/${savedHistory?.season || 1}/${savedHistory?.episode || 1}`
      : `/watch/movie/${id}`;

  const matchScore = getMatchScore(item.vote_average);
  const maturity = getMaturityBadge(item);
  const genres = getGenreNames(item, 3);

  const releaseBadge = getReleaseStatus(releaseDate);
  const showSMonogram = (item.vote_average || 0) >= 7.2 || (item.popularity || 0) >= 85;
  const showTop10Corner = isTop10 || (variant === 'landscape' && (item.popularity || 0) >= 240);

  const landscapeImg = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
    : item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;

  const posterImg = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : landscapeImg;

  const baseImg = variant === 'poster' ? posterImg : landscapeImg;

  const closePreviewImmediate = () => {
    setPreviewRect(null);
    setShowVideo(false);
    setIsMuted(true);
  };

  // Close floating preview if the user scrolls or resizes the window
  useEffect(() => {
    if (!previewRect) return undefined;

    const handleViewportMove = () => {
      setPreviewRect(null);
      setShowVideo(false);
      setIsMuted(true);
    };

    window.addEventListener('scroll', handleViewportMove, { passive: true, capture: true });
    window.addEventListener('resize', handleViewportMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleViewportMove, { capture: true });
      window.removeEventListener('resize', handleViewportMove);
    };
  }, [previewRect]);

  // Lazy-fetch & auto-play YouTube trailer when user holds hover on the pop-out preview
  useEffect(() => {
    if (!previewRect) return undefined;

    let cancelled = false;
    const cacheKey = `${mediaType}-${id}`;

    const videoTimer = setTimeout(async () => {
      if (cardTrailerCache.has(cacheKey)) {
        const cachedKey = cardTrailerCache.get(cacheKey);
        if (!cancelled && cachedKey) {
          setTrailerKey(cachedKey);
          setShowVideo(true);
        }
        return;
      }

      try {
        const res = await fetch(
          `/api/tmdb/${mediaType}/${id}/videos?include_video_language=id,en,null`
        );
        if (!res.ok) {
          cardTrailerCache.set(cacheKey, null);
          return;
        }
        const data = await res.json();
        const videos = data?.results || [];
        const best =
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
        const key = best?.key || null;
        cardTrailerCache.set(cacheKey, key);

        if (!cancelled && key) {
          setTrailerKey(key);
          setShowVideo(true);
        }
      } catch {
        cardTrailerCache.set(cacheKey, null);
      }
    }, 520);

    return () => {
      cancelled = true;
      clearTimeout(videoTimer);
    };
  }, [previewRect, mediaType, id]);

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimerRef.current);
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  const openPreviewWithDelay = (event) => {
    if (event.buttons !== 0) return;
    if (
      typeof window === 'undefined' ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      return;
    }

    clearTimeout(closeTimerRef.current);
    clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = setTimeout(() => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const targetWidth = Math.min(340, Math.max(285, Math.round(rect.width * 1.3)));
      const centeredLeft = rect.left + rect.width / 2 - targetWidth / 2;
      const clampedLeft = Math.max(
        16,
        Math.min(window.innerWidth - targetWidth - 16, centeredLeft)
      );

      const estimatedHeight = Math.round((targetWidth * 9) / 16) + 122;
      const centeredTop = rect.top + rect.height / 2 - estimatedHeight / 2;
      const clampedTop = Math.max(
        16,
        Math.min(window.innerHeight - estimatedHeight - 16, centeredTop)
      );

      setShowVideo(false);
      setIsMuted(true);
      setPreviewRect({
        top: clampedTop,
        left: clampedLeft,
        width: targetWidth,
      });
    }, 340);
  };

  const scheduleClose = () => {
    clearTimeout(hoverTimerRef.current);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setPreviewRect(null);
      setShowVideo(false);
      setIsMuted(true);
    }, 80);
  };

  const keepPreviewOpen = () => {
    clearTimeout(closeTimerRef.current);
  };

  const togglePreviewMute = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const iframe = previewIframeRef.current;
    if (!iframe?.contentWindow) return;

    const nextMuted = !isMuted;
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: nextMuted ? 'mute' : 'unMute',
        args: [],
      }),
      '*'
    );
    setIsMuted(nextMuted);
  };

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={openPreviewWithDelay}
        onMouseLeave={scheduleClose}
        className="group relative block w-full"
      >
        <Link
          href={detailHref}
          replace={replaceNavigation}
          className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-[4px]"
        >
          <div
            className={`relative w-full bg-[#202020] rounded-[4px] overflow-hidden transition-transform duration-200 ${
              variant === 'poster' ? 'aspect-[2/3]' : 'aspect-video'
            }`}
          >
            {baseImg ? (
              <Image
                src={baseImg}
                alt={title}
                fill
                sizes={
                  variant === 'poster'
                    ? '(max-width: 640px) 40vw, 180px'
                    : '(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 280px'
                }
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={priority}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-xs font-semibold text-zinc-500">
                {title}
              </div>
            )}

            {/* Top-Left Netflix "S" Red Monogram */}
            {showSMonogram && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 left-2 z-10 text-[#E50914] font-black text-sm sm:text-[15px] leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] select-none pointer-events-none"
              >
                S
              </span>
            )}

            {/* Top-Right Netflix Red "TOP 10" Corner Ribbon */}
            {showTop10Corner && (
              <div
                aria-hidden="true"
                className="absolute top-0 right-0 z-10 bg-[#E50914] text-white px-1.5 py-1 rounded-bl-[3px] flex flex-col items-center justify-center leading-none shadow-md pointer-events-none select-none"
              >
                <span className="text-[7px] font-extrabold tracking-wider">TOP</span>
                <span className="text-[11px] font-black -mt-px">10</span>
              </div>
            )}

            {/* Poster Bottom Centered Release Ribbon (for Top 10 2:3 cards) */}
            {variant === 'poster' && releaseBadge && (
              <div className="absolute bottom-0 inset-x-0 flex justify-center z-10 pointer-events-none">
                <span className="bg-[#E50914] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-t-[2px] shadow whitespace-nowrap">
                  {releaseBadge}
                </span>
              </div>
            )}

            {/* Landscape Bottom Vignette + Optional Release Pill + Title */}
            {!hideTitle && variant === 'landscape' && (
              <>
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 pointer-events-none space-y-1">
                  {releaseBadge && (
                    <span className="inline-block bg-[#E50914] text-white text-[9px] font-extrabold px-1.5 py-px rounded-[2px] shadow-sm">
                      {releaseBadge}
                    </span>
                  )}
                  <h3 className="text-xs sm:text-[13px] font-bold text-zinc-100 leading-snug line-clamp-1 drop-shadow">
                    {title}
                  </h3>
                </div>
              </>
            )}
          </div>
        </Link>
      </div>

      {/* Unclipped Netflix Hover Pop-out Mini-Preview Portal with Auto-Trailer */}
      {previewRect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onMouseEnter={keepPreviewOpen}
            onMouseLeave={scheduleClose}
            style={{
              position: 'fixed',
              top: `${previewRect.top}px`,
              left: `${previewRect.left}px`,
              width: `${previewRect.width}px`,
            }}
            className="z-[70] rounded-md bg-[#181818] shadow-[0_16px_42px_rgba(0,0,0,0.92)] ring-1 ring-white/15 overflow-hidden select-none animate-netflix-pop"
          >
            {/* Top 16:9 Artwork / Auto-Playing Video Preview */}
            <div className="relative w-full aspect-video bg-[#141414] overflow-hidden">
              <Link
                href={detailHref}
                replace={replaceNavigation}
                onClick={closePreviewImmediate}
                className="block relative w-full h-full"
              >
                {landscapeImg ? (
                  <Image
                    src={landscapeImg}
                    alt={title}
                    fill
                    sizes="340px"
                    className={`object-cover transition-opacity duration-500 ${
                      showVideo && trailerKey ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-xs font-bold text-zinc-500 text-center">
                    {title}
                  </div>
                )}

                {showVideo && trailerKey && (
                  <div className="absolute inset-0 w-full h-full scale-[1.38] origin-center pointer-events-none">
                    <iframe
                      ref={previewIframeRef}
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
                      title={title}
                      className="w-full h-full border-none pointer-events-none"
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-3.5 right-12 pointer-events-none">
                  <h4 className="text-sm font-extrabold text-white line-clamp-1 drop-shadow-md">
                    {title}
                  </h4>
                </div>
              </Link>

              {/* Floating Mute/Unmute Toggle when Trailer Plays */}
              {showVideo && trailerKey && (
                <button
                  type="button"
                  onClick={togglePreviewMute}
                  aria-label={isMuted ? 'Nyalakan suara pratinjau' : 'Bisukan suara pratinjau'}
                  className="absolute bottom-2 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/55 bg-black/60 text-white hover:border-white hover:bg-black/85 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              )}
            </div>

            {/* Bottom Action & Metadata Panel */}
            <div className="p-3.5 pt-2.5 space-y-2.5 bg-[#181818]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={watchHref}
                    replace={replaceNavigation}
                    onClick={closePreviewImmediate}
                    title="Putar"
                    aria-label={`Putar ${title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-transform active:scale-90"
                  >
                    <Play size={15} className="fill-black translate-x-px" />
                  </Link>
                  <WatchlistButton item={item} size="sm" />
                </div>

                <Link
                  href={detailHref}
                  replace={replaceNavigation}
                  onClick={closePreviewImmediate}
                  title="Episode & Info"
                  aria-label={`Detail ${title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-400/80 bg-[#2a2a2a]/70 text-zinc-100 hover:border-white hover:bg-[#2a2a2a] transition-all active:scale-90"
                >
                  <ChevronDown size={17} />
                </Link>
              </div>

              {/* Match %, Age Badge, Year, HD */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-zinc-300">
                {matchScore ? (
                  <span className="text-emerald-400 font-bold">{matchScore}% Cocok</span>
                ) : (
                  <span className="text-emerald-400 font-bold">Baru</span>
                )}
                <span className="border border-zinc-500 px-1.5 py-px text-[10px] leading-tight text-zinc-200">
                  {maturity}
                </span>
                {year && <span>{year}</span>}
                <span className="border border-zinc-500/80 rounded-[2px] px-1 text-[9px] leading-tight text-zinc-300 font-bold">
                  HD
                </span>
              </div>

              {/* Genre Dots */}
              {genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-200 font-medium">
                  {genres.map((genreName, idx) => (
                    <span key={genreName} className="flex items-center gap-1.5">
                      {idx > 0 && <span className="text-zinc-600 text-[9px]">•</span>}
                      <span>{genreName}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
