"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Info } from 'lucide-react';

export default function HeroBanner({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const [playTrailer, setPlayTrailer] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const pointerStartRef = useRef(null);
  const isPointerDraggingRef = useRef(false);

  const currentItem = items[currentIndex];

  // Reset trailer state when the slide changes — adjusted during render
  // instead of inside an effect to avoid cascading re-renders
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  if (prevIndex !== currentIndex) {
    setPrevIndex(currentIndex);
    setTrailerKey(null);
    setPlayTrailer(false);
  }

  // Clear any pending hover-preview timeout when the slide changes
  useEffect(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, [currentIndex]);

  // Auto rotate slides every 8 seconds if trailer is not playing
  useEffect(() => {
    if (playTrailer) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [items.length, playTrailer, currentIndex]);

  const handleMouseEnter = () => {
    if (!currentItem) return;
    
    hoverTimeoutRef.current = setTimeout(async () => {
      const mediaType = currentItem.media_type || 'movie';
      try {
        const res = await fetch(`/api/tmdb/${mediaType}/${currentItem.id}/videos`);
        const data = await res.json();
        const youtubeTrailer = data.results?.find(
          (video) => video.site === 'YouTube' && video.type === 'Trailer'
        );
        if (youtubeTrailer) {
          setTrailerKey(youtubeTrailer.key);
          setPlayTrailer(true);
        }
      } catch (err) {
        console.error("Failed to fetch trailer:", err);
      }
    }, 1500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setPlayTrailer(false);
    setTrailerKey(null);
  };

  const goToSlide = (direction) => {
    setCurrentIndex((prev) => (prev + direction + items.length) % items.length);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    isPointerDraggingRef.current = false;
  };

  const handlePointerMove = (event) => {
    const start = pointerStartRef.current;
    if (!start) return;
    if (Math.abs(event.clientX - start.x) > 10) {
      isPointerDraggingRef.current = true;
    }
  };

  const handlePointerUp = (event) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      goToSlide(deltaX < 0 ? 1 : -1);
    }
  };

  // A drag should switch slides without also activating the link underneath.
  const handleClickCapture = (event) => {
    if (!isPointerDraggingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    isPointerDraggingRef.current = false;
  };

  if (!currentItem) return null;

  const mediaType = currentItem.media_type || 'movie';
  const title = currentItem.title || currentItem.name;
  const synopsis = currentItem.overview || 'Tidak ada sinopsis tersedia.';
  const watchHref = mediaType === 'tv' ? `/watch/tv/${currentItem.id}/1/1` : `/movie/${currentItem.id}?play=true`;
  const detailHref = `/${mediaType}/${currentItem.id}`;

  return (
    <div 
      className="relative w-full h-[72vh] min-h-[520px] max-h-[820px] sm:h-[70vh] sm:min-h-0 md:h-[80vh] bg-zinc-950 overflow-hidden touch-pan-y select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { pointerStartRef.current = null; }}
      onClickCapture={handleClickCapture}
    >
      {/* Background Image / Video Player */}
      <div className="absolute inset-0 w-full h-full">
        {playTrailer && trailerKey ? (
          <div className="w-full h-full scale-[1.35] origin-center">
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
              title={title}
              className="w-full h-full border-none pointer-events-none"
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : (
          <>
            <Image
              src={`https://image.tmdb.org/t/p/w1280${currentItem.backdrop_path}`}
              alt={title}
              fill
              priority
              className="object-cover"
            />
            {/* Ambient vignette shadow gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
          </>
        )}
      </div>

      {/* Top scrim keeps the transparent navbar legible over bright artwork */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none" />

      {/* Hero Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex w-full max-w-4xl flex-col gap-2.5 p-5 pb-16 sm:gap-3 sm:p-6 sm:pb-10 md:gap-4 md:p-12">
        {/* Release year and rating */}
        <div className="flex items-center gap-3 text-xs md:text-sm font-semibold text-zinc-300">
          <span className="bg-red-600 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold text-white">
            Populer
          </span>
          <span>
            {currentItem.release_date?.split('-')[0] || currentItem.first_air_date?.split('-')[0]}
          </span>
          {currentItem.vote_average > 0 && (
            <span className="text-yellow-500">
              ★ {currentItem.vote_average?.toFixed(1)}
            </span>
          )}
        </div>

        {/* Title or Logo */}
        {currentItem.logoUrl ? (
          <div className="relative h-14 sm:h-16 md:h-20 lg:h-24 w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] select-none mb-1">
            <Image
              src={currentItem.logoUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 280px, (max-width: 1024px) 340px, 400px"
              className="object-contain object-left"
              priority
            />
          </div>
        ) : (
          <h1 className="max-w-full break-words text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
            {title}
          </h1>
        )}

        {/* Synopsis */}
        <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 md:line-clamp-4 max-w-2xl leading-relaxed drop-shadow-md">
          {synopsis}
        </p>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href={watchHref}
            className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-red-600 px-4 text-xs font-bold text-white transition-all duration-150 hover:bg-red-700 active:scale-95 sm:h-11 sm:px-6 sm:text-sm md:text-base"
          >
            <Play size={17} className="shrink-0 fill-white" />
            Nonton Sekarang
          </Link>
          <Link
            href={detailHref}
            className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-zinc-800/80 px-4 text-xs font-bold text-zinc-100 backdrop-blur-sm transition-all duration-150 hover:bg-zinc-700 active:scale-95 sm:h-11 sm:px-6 sm:text-sm md:text-base"
          >
            <Info size={17} className="shrink-0" />
            Detail
          </Link>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-5 right-5 z-10 flex gap-0.5 sm:bottom-6 sm:right-6 md:bottom-12 md:right-12">
        {items.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className="flex h-6 w-6 items-center justify-center"
            aria-label={`Slide ke-${idx + 1}`}
            aria-current={idx === currentIndex}
          >
            <span
              className={`block h-2.5 rounded-full transition-all duration-150 ${idx === currentIndex ? 'w-6 bg-red-600' : 'w-2.5 bg-zinc-600'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
