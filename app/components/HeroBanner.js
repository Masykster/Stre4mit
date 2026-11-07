"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Info, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMaturityBadge } from '../lib/genres';

export default function HeroBanner({ items, badgeLabel = '#1 di Indonesia Hari Ini' }) {
  const { history } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const [playTrailer, setPlayTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [isTextHovered, setIsTextHovered] = useState(false);

  const iframeRef = useRef(null);
  const pointerStartRef = useRef(null);
  const isPointerDraggingRef = useRef(false);

  const currentItem = items?.[currentIndex];
  const currentItemId = currentItem?.id;

  // Reset trailer & compact state when featured item changes during render
  const [prevItemId, setPrevItemId] = useState(currentItemId);
  if (prevItemId !== currentItemId) {
    setPrevItemId(currentItemId);
    setTrailerKey(null);
    setPlayTrailer(false);
    setIsMuted(true);
    setIsCompact(false);
  }

  // Automatically fetch & play muted YouTube trailer after 2.4s (Netflix Billboard behavior)
  useEffect(() => {
    if (!currentItem) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    const mediaType = currentItem.media_type || (currentItem.first_air_date ? 'tv' : 'movie');

    const startTimer = setTimeout(async () => {
      if (typeof window !== 'undefined' && window.scrollY > 400) return;

      try {
        const res = await fetch(`/api/tmdb/${mediaType}/${currentItem.id}/videos`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const videos = data.results || [];
        const youtubeVideo =
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

        if (youtubeVideo) {
          setTrailerKey(youtubeVideo.key);
          setPlayTrailer(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load hero trailer:', err);
        }
      }
    }, 2400);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(startTimer);
    };
  }, [currentItem]);

  // Collapse synopsis gently after 4.5s of trailer playback so artwork shines
  useEffect(() => {
    if (!playTrailer) return undefined;

    const compactTimer = setTimeout(() => {
      setIsCompact(true);
    }, 4500);

    return () => clearTimeout(compactTimer);
  }, [playTrailer]);

  // Gently rotate billboard every 16s only if no trailer is playing
  useEffect(() => {
    if (playTrailer || !items || items.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 16000);

    return () => clearInterval(interval);
  }, [items, playTrailer]);

  const toggleMute = () => {
    const iframe = iframeRef.current;
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

  const replayTrailer = () => {
    if (trailerKey) {
      setPlayTrailer(true);
      setIsMuted(true);
    }
  };

  const goToSlide = (direction) => {
    if (!items || items.length <= 1) return;
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

    if (Math.abs(deltaX) >= 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      goToSlide(deltaX < 0 ? 1 : -1);
    }
  };

  const handleClickCapture = (event) => {
    if (!isPointerDraggingRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    isPointerDraggingRef.current = false;
  };

  if (!currentItem) return null;

  const mediaType = currentItem.media_type || (currentItem.first_air_date ? 'tv' : 'movie');
  const title = currentItem.title || currentItem.name;
  const synopsis = currentItem.overview || 'Saksikan tayangan pilihan terpopuler minggu ini.';
  const maturity = getMaturityBadge(currentItem);

  const savedHistory = mediaType === 'tv'
    ? history.find((h) => Number(h.id) === Number(currentItem.id) && h.media_type === 'tv')
    : null;
  const watchHref = mediaType === 'tv'
    ? `/watch/tv/${currentItem.id}/${savedHistory?.season || 1}/${savedHistory?.episode || 1}`
    : `/watch/movie/${currentItem.id}`;
  const detailHref = `/${mediaType}/${currentItem.id}`;

  const showSynopsis = !isCompact || isTextHovered || !playTrailer;

  return (
    <div
      className="relative w-full h-[78vh] min-h-[540px] max-h-[880px] md:h-[88vh] bg-[#141414] overflow-hidden touch-pan-y select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
      onClickCapture={handleClickCapture}
    >
      {/* Backdrop Artwork & Auto-playing Trailer Layer */}
      <div className="absolute inset-0 w-full h-full">
        {currentItem.backdrop_path && (
          <Image
            src={`https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`}
            alt={title}
            fill
            priority
            sizes="100vw"
            className={`object-cover object-top transition-opacity duration-700 ${
              playTrailer && trailerKey ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {playTrailer && trailerKey && (
          <div className="absolute inset-0 w-full h-full scale-[1.35] origin-center pointer-events-none">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
              title={title}
              className="w-full h-full border-none pointer-events-none"
              allow="autoplay; encrypted-media"
            />
          </div>
        )}

        {/* Netflix Left Vignette & Seamless #141414 Bottom Fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/90 via-[#141414]/35 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 md:h-72 bg-gradient-to-t from-[#141414] via-[#141414]/65 to-transparent pointer-events-none" />
      </div>

      {/* Top Scrim for Transparent Navbar Legibility */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none" />

      {/* Left Billboard Content — padded at bottom so overlapping Row #1 never covers buttons */}
      <div
        onMouseEnter={() => setIsTextHovered(true)}
        onMouseLeave={() => setIsTextHovered(false)}
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-28 sm:pb-36 md:pb-44 max-w-3xl pointer-events-auto"
      >
        {/* Title Logo or Bold Display Heading */}
        {currentItem.logoUrl ? (
          <div
            className={`relative h-16 sm:h-20 md:h-28 lg:h-32 w-full max-w-[260px] sm:max-w-[340px] md:max-w-[440px] origin-bottom-left transition-transform duration-700 mb-3 ${
              !showSynopsis ? 'scale-90' : 'scale-100'
            }`}
          >
            <Image
              src={currentItem.logoUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 260px, (max-width: 1024px) 340px, 440px"
              className="object-contain object-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.75)]"
              priority
            />
          </div>
        ) : (
          <h1 className="max-w-full break-words text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] mb-3">
            {title}
          </h1>
        )}

        {/* Netflix Top 10 Rank Badge */}
        {badgeLabel && (
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="inline-flex flex-col items-center justify-center bg-[#E50914] text-white font-black leading-none px-1.5 py-1 rounded-[2px] text-[9px] tracking-tighter shadow">
              <span>TOP</span>
              <span className="text-[11px]">10</span>
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-white drop-shadow">
              {currentIndex === 0 ? badgeLabel : `#${currentIndex + 1} Sedang Trending Hari Ini`}
            </span>
          </div>
        )}

        {/* Collapsible Synopsis */}
        <div
          className={`overflow-hidden transition-all duration-700 ease-out ${
            showSynopsis ? 'max-h-32 opacity-100 mb-5' : 'max-h-0 opacity-0 mb-2'
          }`}
        >
          <p className="text-xs sm:text-sm md:text-[15px] text-zinc-100/95 line-clamp-3 max-w-xl leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
            {synopsis}
          </p>
        </div>

        {/* Netflix Action Buttons: Solid White "Putar" & Translucent Gray "Selengkapnya" */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={watchHref}
            className="flex h-10 sm:h-11 md:h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-[4px] bg-white px-5 sm:px-7 text-xs sm:text-sm md:text-base font-bold text-black transition-all duration-150 hover:bg-white/80 active:scale-95 shadow-lg"
          >
            <Play size={20} className="shrink-0 fill-black text-black" />
            Putar
          </Link>
          <Link
            href={detailHref}
            className="flex h-10 sm:h-11 md:h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-[4px] bg-[#6d6d6e]/70 px-5 sm:px-7 text-xs sm:text-sm md:text-base font-bold text-white backdrop-blur-xs transition-all duration-150 hover:bg-[#6d6d6e]/45 active:scale-95 shadow-lg"
          >
            <Info size={20} className="shrink-0" />
            Selengkapnya
          </Link>
        </div>
      </div>

      {/* Bottom-Right Netflix Audio Toggle & Maturity Classification */}
      <div className="absolute right-0 bottom-28 sm:bottom-36 md:bottom-44 z-10 flex items-center gap-3">
        {playTrailer && trailerKey ? (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Nyalakan suara trailer' : 'Bisukan suara trailer'}
            title={isMuted ? 'Nyalakan suara' : 'Bisukan'}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-white/15 hover:border-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        ) : trailerKey ? (
          <button
            type="button"
            onClick={replayTrailer}
            aria-label="Putar ulang trailer"
            title="Putar ulang trailer"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-white/15 hover:border-white transition-colors cursor-pointer"
          >
            <RotateCcw size={17} />
          </button>
        ) : null}

        <div className="border-l-[3px] border-zinc-200 bg-[#141414]/65 backdrop-blur-xs py-1.5 pl-3 pr-5 sm:pr-8 text-xs sm:text-sm font-semibold text-zinc-100">
          {maturity}
        </div>
      </div>
    </div>
  );
}
