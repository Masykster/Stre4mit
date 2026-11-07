"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronDown } from 'lucide-react';
import WatchlistButton from './WatchlistButton';
import { useApp } from '../context/AppContext';
import { getGenreNames, getMatchScore, getMaturityBadge } from '../lib/genres';

export default function MovieCard({
  item,
  priority = false,
  variant = 'landscape',
  hideTitle = false,
}) {
  const { history } = useApp();
  const cardRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [previewRect, setPreviewRect] = useState(null);

  const id = item.id;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name || 'Tanpa Judul';
  const releaseDate = item.release_date || item.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const detailHref = `/${mediaType}/${id}`;

  // Resume from last watched season/episode if available for TV shows
  const savedHistory = mediaType === 'tv'
    ? history.find((h) => Number(h.id) === Number(id) && h.media_type === 'tv')
    : null;
  const watchHref = mediaType === 'tv'
    ? `/watch/tv/${id}/${savedHistory?.season || 1}/${savedHistory?.episode || 1}`
    : `/watch/movie/${id}`;

  const matchScore = getMatchScore(item.vote_average);
  const maturity = getMaturityBadge(item);
  const genres = getGenreNames(item, 3);

  const landscapeImg = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
    : item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;

  const posterImg = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : landscapeImg;

  const baseImg = variant === 'poster' ? posterImg : landscapeImg;

  // Close floating preview if the user scrolls or resizes the window
  useEffect(() => {
    if (!previewRect) return undefined;

    const closeImmediate = () => setPreviewRect(null);
    window.addEventListener('scroll', closeImmediate, { passive: true, capture: true });
    window.addEventListener('resize', closeImmediate, { passive: true });
    return () => {
      window.removeEventListener('scroll', closeImmediate, { capture: true });
      window.removeEventListener('resize', closeImmediate);
    };
  }, [previewRect]);

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimerRef.current);
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  const openPreviewWithDelay = (event) => {
    // Only open floating mini-modal on hover-capable desktop pointers and when not dragging
    if (event.buttons !== 0) return;
    if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    clearTimeout(closeTimerRef.current);
    clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = setTimeout(() => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const targetWidth = Math.min(330, Math.max(280, Math.round(rect.width * 1.28)));
      const centeredLeft = rect.left + rect.width / 2 - targetWidth / 2;
      const clampedLeft = Math.max(16, Math.min(window.innerWidth - targetWidth - 16, centeredLeft));

      const estimatedHeight = Math.round((targetWidth * 9) / 16) + 118;
      const centeredTop = rect.top + rect.height / 2 - estimatedHeight / 2;
      const clampedTop = Math.max(16, Math.min(window.innerHeight - estimatedHeight - 16, centeredTop));

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
    }, 80);
  };

  const keepPreviewOpen = () => {
    clearTimeout(closeTimerRef.current);
  };

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={openPreviewWithDelay}
        onMouseLeave={scheduleClose}
        className="group relative block w-full"
      >
        <Link href={detailHref} className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-[4px]">
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

            {/* Subtle Netflix bottom vignette + title inside landscape card */}
            {!hideTitle && variant === 'landscape' && (
              <>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 pointer-events-none">
                  <h3 className="text-xs sm:text-[13px] font-bold text-zinc-100 leading-snug line-clamp-1 drop-shadow">
                    {title}
                  </h3>
                </div>
              </>
            )}
          </div>
        </Link>
      </div>

      {/* Unclipped Netflix Hover Pop-out Mini-Preview Portal */}
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
            {/* Top 16:9 Artwork */}
            <Link href={detailHref} onClick={() => setPreviewRect(null)} className="block relative w-full aspect-video bg-[#141414] overflow-hidden">
              {landscapeImg ? (
                <Image
                  src={landscapeImg}
                  alt={title}
                  fill
                  sizes="330px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-xs font-bold text-zinc-500 text-center">
                  {title}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent" />
              <div className="absolute bottom-2 left-3.5 right-3.5">
                <h4 className="text-sm font-extrabold text-white line-clamp-1 drop-shadow-md">
                  {title}
                </h4>
              </div>
            </Link>

            {/* Bottom Action & Metadata Panel */}
            <div className="p-3.5 pt-2.5 space-y-2.5 bg-[#181818]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={watchHref}
                    onClick={() => setPreviewRect(null)}
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
                  onClick={() => setPreviewRect(null)}
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
