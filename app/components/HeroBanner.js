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

  const currentItem = items[currentIndex];

  // Auto rotate slides every 8 seconds if trailer is not playing
  useEffect(() => {
    if (playTrailer) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [items.length, playTrailer]);

  // Reset trailer state when slide changes
  useEffect(() => {
    setTrailerKey(null);
    setPlayTrailer(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, [currentIndex]);

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

  if (!currentItem) return null;

  const mediaType = currentItem.media_type || 'movie';
  const title = currentItem.title || currentItem.name;
  const synopsis = currentItem.overview || 'Tidak ada sinopsis tersedia.';
  const watchHref = mediaType === 'tv' ? `/watch/tv/${currentItem.id}/1/1` : `/watch/movie/${currentItem.id}`;
  const detailHref = `/${mediaType}/${currentItem.id}`;

  return (
    <div 
      className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-zinc-950 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
              src={`https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`}
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

      {/* Hero Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl z-10 flex flex-col gap-3 md:gap-4">
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

        {/* Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
          {title}
        </h1>

        {/* Synopsis */}
        <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 md:line-clamp-4 max-w-2xl leading-relaxed drop-shadow-md">
          {synopsis}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <Link
            href={watchHref}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm md:text-base px-6 h-11 rounded-full transition-all duration-150"
          >
            <Play size={18} className="fill-white" />
            Nonton Sekarang
          </Link>
          <Link
            href={detailHref}
            className="flex items-center justify-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-100 font-bold text-sm md:text-base px-6 h-11 rounded-full backdrop-blur-sm transition-all duration-150"
          >
            <Info size={18} />
            Detail
          </Link>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute right-6 md:right-12 bottom-6 md:bottom-12 flex gap-1.5 z-10">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${idx === currentIndex ? 'bg-red-600 w-6' : 'bg-zinc-600'}`}
            aria-label={`Slide ke-${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
