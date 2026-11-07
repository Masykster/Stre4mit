"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Volume2, VolumeX, RotateCcw, ArrowLeft } from 'lucide-react';
import WatchlistButton from './WatchlistButton';
import { useApp } from '../context/AppContext';
import { getMaturityBadge } from '../lib/genres';

export default function MediaHeroHeader({
  data,
  mediaType,
  title,
  logoUrl,
  trailerKey,
  isModal = false,
}) {
  const { history } = useApp();
  const [playTrailer, setPlayTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef(null);

  // Auto-play trailer softly after 2s if available
  useEffect(() => {
    if (!trailerKey) return undefined;

    const timer = setTimeout(() => {
      setPlayTrailer(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [trailerKey]);

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

  const savedTV = mediaType === 'tv'
    ? history.find((h) => Number(h.id) === Number(data.id) && h.media_type === 'tv')
    : null;

  const watchHref = mediaType === 'tv'
    ? `/watch/tv/${data.id}/${savedTV?.season || 1}/${savedTV?.episode || 1}`
    : `/watch/movie/${data.id}`;

  const playLabel =
    mediaType === 'tv' && savedTV?.season && savedTV?.episode
      ? `Lanjutkan B${savedTV.season}:E${savedTV.episode}`
      : 'Putar';

  const maturity = getMaturityBadge(data);
  const itemForWatchlist = { ...data, media_type: mediaType };

  const bottomFadeColor = isModal
    ? 'from-[#181818] via-[#181818]/75 to-transparent'
    : 'from-[#141414] via-[#141414]/70 to-transparent';

  return (
    <div
      className={`relative w-full bg-[#141414] overflow-hidden select-none ${
        isModal
          ? 'aspect-video min-h-[250px] sm:min-h-[360px] max-h-[520px]'
          : 'h-[60vh] min-h-[420px] max-h-[760px] sm:h-[68vh] md:h-[76vh]'
      }`}
    >
      {/* Crisp Unblurred Backdrop & Optional Auto-playing Trailer */}
      <div className="absolute inset-0 w-full h-full">
        {data.backdrop_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/original${data.backdrop_path}`}
            alt={title}
            fill
            priority
            sizes={isModal ? '(max-width: 960px) 100vw, 920px' : '100vw'}
            className={`object-cover object-top transition-opacity duration-700 ${
              playTrailer && trailerKey ? 'opacity-0' : 'opacity-100'
            }`}
          />
        ) : data.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w780${data.poster_path}`}
            alt={title}
            fill
            priority
            sizes={isModal ? '(max-width: 960px) 100vw, 920px' : '100vw'}
            className="object-cover opacity-50"
          />
        ) : null}

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

        {/* Netflix Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/85 via-[#141414]/25 to-transparent pointer-events-none" />
        <div className={`absolute inset-x-0 bottom-0 h-40 md:h-56 bg-gradient-to-t ${bottomFadeColor} pointer-events-none`} />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 via-black/25 to-transparent pointer-events-none" />
      </div>

      {/* Subtle Back Link below Navbar (Full Page only) */}
      {!isModal && (
        <div className="absolute top-20 left-4 md:left-12 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white backdrop-blur-sm transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Kembali</span>
          </Link>
        </div>
      )}

      {/* Bottom Title Logo & Primary Actions */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 ${
          isModal
            ? 'px-5 sm:px-10 pb-6 sm:pb-8'
            : 'max-w-6xl mx-auto px-4 md:px-12 pb-8 md:pb-12'
        }`}
      >
        <div className="space-y-5 max-w-2xl">
          {logoUrl ? (
            <div className="relative h-16 sm:h-24 md:h-28 w-full max-w-[240px] sm:max-w-[340px] md:max-w-[420px]">
              <Image
                src={logoUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 240px, 420px"
                className="object-contain object-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                priority
              />
            </div>
          ) : (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
              {title}
            </h1>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={watchHref}
              replace={isModal}
              className="flex h-10 sm:h-11 items-center justify-center gap-2.5 rounded-[4px] bg-white hover:bg-white/85 active:scale-95 px-6 sm:px-8 text-xs sm:text-sm md:text-base font-bold text-black transition-all shadow-lg"
            >
              <Play size={19} className="fill-black text-black" />
              <span>{playLabel}</span>
            </Link>

            <WatchlistButton item={itemForWatchlist} size="md" />
          </div>
        </div>

        {/* Right Audio & Maturity Controls */}
        <div className="flex items-center gap-3 mb-1">
          {playTrailer && trailerKey ? (
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white hover:bg-white/15 hover:border-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          ) : trailerKey ? (
            <button
              type="button"
              onClick={() => {
                setPlayTrailer(true);
                setIsMuted(true);
              }}
              aria-label="Putar trailer"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white hover:bg-white/15 hover:border-white transition-colors cursor-pointer"
            >
              <RotateCcw size={17} />
            </button>
          ) : null}

          <div className="border-l-[3px] border-zinc-200 bg-[#141414]/70 backdrop-blur-xs py-1 pl-3 pr-4 sm:pr-6 text-xs sm:text-sm font-semibold text-zinc-100">
            {maturity}
          </div>
        </div>
      </div>
    </div>
  );
}
