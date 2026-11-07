"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Check, Play, Info, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { getGenreNames, getMaturityBadge } from '@/app/lib/genres';
import MovieRow from './MovieRow';
import Top10Row from './Top10Row';

const ID_MONTHS_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
];

const ID_MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatIndonesianRelease(dateStr) {
  if (!dateStr) return { monthShort: 'SEGERA', dayNum: '•', fullLabel: 'Segera Hadir' };
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || !parts[1] || !parts[2]) {
    return { monthShort: 'SEGERA', dayNum: '•', fullLabel: dateStr };
  }
  const [year, month, day] = parts;
  return {
    monthShort: ID_MONTHS_SHORT[month - 1] || 'SEGERA',
    dayNum: String(day).padStart(2, '0'),
    fullLabel: `Hadir pada ${day} ${ID_MONTHS_FULL[month - 1] || ''} ${year}`,
  };
}

const trailerCache = new Map();

function ComingSoonCard({ item }) {
  const { hasReminder, toggleReminder } = useApp();
  const [trailerKey, setTrailerKey] = useState(null);
  const [playingTrailer, setPlayingTrailer] = useState(false);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef(null);

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name || 'Tanpa Judul';
  const rawDate = item.release_date || item.first_air_date || '';
  const { monthShort, dayNum, fullLabel } = formatIndonesianRelease(rawDate);
  const genres = getGenreNames(item, 4);
  const maturity = getMaturityBadge(item);
  const reminded = hasReminder(item.id, mediaType);
  const detailHref = `/${mediaType}/${item.id}`;

  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;

  const handlePlayPreview = async () => {
    const cacheKey = `${mediaType}-${item.id}`;
    if (trailerCache.has(cacheKey)) {
      const cached = trailerCache.get(cacheKey);
      if (cached) {
        setTrailerKey(cached);
        setPlayingTrailer(true);
      }
      return;
    }

    setLoadingTrailer(true);
    try {
      const res = await fetch(
        `/api/tmdb/${mediaType}/${item.id}/videos?include_video_language=id,en,null`
      );
      const data = await res.json();
      const videos = data?.results || [];
      const best =
        videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
        videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
        videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
        videos.find((v) => v.site === 'YouTube');
      const key = best?.key || null;
      trailerCache.set(cacheKey, key);
      if (key) {
        setTrailerKey(key);
        setPlayingTrailer(true);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming trailer:', err);
    } finally {
      setLoadingTrailer(false);
    }
  };

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

  return (
    <article className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-start">
      {/* Left Netflix Calendar Date Column */}
      <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0 sm:w-20 flex-shrink-0 pt-1 select-none">
        <span className="text-xs sm:text-sm font-bold tracking-widest text-zinc-400 uppercase">
          {monthShort}
        </span>
        <span className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-none">
          {dayNum}
        </span>
      </div>

      {/* Right Netflix Worth-the-Wait Card */}
      <div className="w-full max-w-3xl rounded-[6px] bg-[#181818] border border-white/10 overflow-hidden shadow-xl">
        {/* 16:9 Media Preview */}
        <div className="relative w-full aspect-video bg-[#101010] overflow-hidden">
          {playingTrailer && trailerKey ? (
            <>
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                title={title}
                className="w-full h-full border-none scale-[1.32] pointer-events-none"
                allow="autoplay; encrypted-media"
              />
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
                className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 border border-white/40 text-white hover:border-white cursor-pointer"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </>
          ) : (
            <>
              {backdropUrl ? (
                <Image
                  src={backdropUrl}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-500">
                  {title}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/15 to-transparent" />

              {/* Center Play Trailer Trigger */}
              <button
                type="button"
                onClick={handlePlayPreview}
                disabled={loadingTrailer}
                aria-label={`Putar cuplikan ${title}`}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
              >
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/65 border-2 border-white/80 text-white group-hover:scale-110 group-hover:bg-[#E50914] group-hover:border-[#E50914] transition-all shadow-lg">
                  {loadingTrailer ? (
                    <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Play size={22} className="fill-white translate-x-0.5" />
                  )}
                </span>
              </button>

              <span className="absolute top-3 left-3 bg-[#E50914] text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[2px] shadow">
                Segera Hadir
              </span>
            </>
          )}
        </div>

        {/* Editorial Info & Remind Me Actions */}
        <div className="p-4 sm:p-6 space-y-3.5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
                <span className="text-emerald-400 font-bold">{fullLabel}</span>
                <span>•</span>
                <span className="border border-zinc-600 px-1.5 py-px text-[10px] text-zinc-300">
                  {maturity}
                </span>
                <span className="uppercase text-[10px] text-zinc-400">
                  {mediaType === 'tv' ? 'Serial TV' : 'Film'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => toggleReminder({ ...item, media_type: mediaType })}
                className={`inline-flex items-center gap-2 px-4 h-9 rounded-[4px] text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  reminded
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'bg-[#2a2a2a] hover:bg-[#383838] text-white border border-white/15'
                }`}
              >
                {reminded ? <Check size={15} strokeWidth={2.6} /> : <Bell size={15} />}
                <span>{reminded ? 'Pengingat Aktif' : 'Ingatkan Saya'}</span>
              </button>

              <Link
                href={detailHref}
                aria-label={`Detail ${title}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#383838] border border-white/15 text-zinc-200 hover:text-white transition-colors"
              >
                <Info size={16} />
              </Link>
            </div>
          </div>

          {item.overview && (
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-3">
              {item.overview}
            </p>
          )}

          {genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-semibold text-zinc-200">
              {genres.map((g, idx) => (
                <span key={g} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-zinc-600 text-[10px]">•</span>}
                  <span>{g}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ComingSoonList({
  newReleases = [],
  topTV = [],
  topMovies = [],
  upcomingItems = [],
}) {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'Semua' },
    { id: 'new', label: '🍿 Baru di Stre4mit' },
    { id: 'top-tv', label: '🏆 Top 10 Acara TV' },
    { id: 'top-movie', label: '🎬 Top 10 Film' },
    { id: 'upcoming', label: '🔔 Segera Hadir' },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-zinc-100 pt-16 md:pt-[68px] pb-24">
      {/* Sticky Netflix New & Popular Sub-Header */}
      <div className="sticky top-16 md:top-[68px] z-30 bg-[#141414]/95 backdrop-blur-md border-b border-white/5 px-4 md:px-12 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-white tracking-tight">
            Baru & Populer
          </h1>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-[#262626] text-zinc-300 hover:bg-[#333333] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-11 pt-6">
        {(activeTab === 'all' || activeTab === 'new') && newReleases.length > 0 && (
          <MovieRow title="Baru di Stre4mit" items={newReleases} />
        )}

        {(activeTab === 'all' || activeTab === 'top-tv') && topTV.length > 0 && (
          <Top10Row title="Top 10 Acara TV di Indonesia Hari Ini" items={topTV} />
        )}

        {(activeTab === 'all' || activeTab === 'top-movie') && topMovies.length > 0 && (
          <Top10Row title="Top 10 Film di Indonesia Hari Ini" items={topMovies} />
        )}

        {(activeTab === 'all' || activeTab === 'upcoming') && upcomingItems.length > 0 && (
          <section className="px-4 md:px-12 space-y-6 pt-2">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                Layak Ditunggu • Segera Hadir
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Aktifkan pengingat agar tayangan yang akan rilis otomatis tersimpan ke Daftar Saya.
              </p>
            </div>

            <div className="space-y-8">
              {upcomingItems.map((item) => (
                <ComingSoonCard key={`upcoming-${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
