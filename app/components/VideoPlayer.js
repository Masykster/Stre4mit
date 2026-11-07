"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import {
  Maximize2,
  Minimize2,
  ArrowLeft,
  SkipForward,
  ChevronLeft,
  Layers,
  ListVideo,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { VIDEO_SOURCES } from '../lib/videoSources';
import useEmbedFallback from '../hooks/useEmbedFallback';

export default function VideoPlayer({
  id,
  type,
  title,
  episodeTitle = '',
  backdropPath,
  season,
  episode,
  episodes: initialEpisodes = [],
  seasons = [],
  nextEpisodeHref,
  prevEpisodeHref,
}) {
  const router = useRouter();
  const { addToHistory, isLoaded, exitWatchPlayer } = useApp();
  const {
    source,
    embedUrl,
    iframeKey,
    notice,
    exhausted,
    selectSource,
    handleFrameLoad,
    retry,
  } = useEmbedFallback({
    type,
    id,
    season,
    episode,
  });

  const playerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const popoverAreaRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [episodeMenuOpen, setEpisodeMenuOpen] = useState(false);

  // State for browsing other seasons inside the in-player Episode Drawer
  const [drawerSeason, setDrawerSeason] = useState(season || 1);
  const [drawerEpisodes, setDrawerEpisodes] = useState(initialEpisodes);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Sync drawer season/episodes when route episode changes during render
  const [prevRouteKey, setPrevRouteKey] = useState(`${id}-${season}-${episode}`);
  const currentRouteKey = `${id}-${season}-${episode}`;
  if (prevRouteKey !== currentRouteKey) {
    setPrevRouteKey(currentRouteKey);
    setDrawerSeason(season || 1);
    setDrawerEpisodes(initialEpisodes);
    setEpisodeMenuOpen(false);
    setServerMenuOpen(false);
  }

  // Fetch season episodes if user switches season inside the player drawer
  useEffect(() => {
    if (type !== 'tv' || !episodeMenuOpen) return undefined;
    if (Number(drawerSeason) === Number(season) && initialEpisodes.length > 0) {
      return undefined;
    }

    let cancelled = false;
    const loadSeason = async () => {
      setDrawerLoading(true);
      try {
        const res = await fetch(`/api/tmdb/tv/${id}/season/${drawerSeason}?language=id-ID`);
        const data = await res.json();
        if (!cancelled && data.episodes) {
          setDrawerEpisodes(data.episodes);
        }
      } catch (err) {
        console.error('Failed to fetch drawer episodes:', err);
      } finally {
        if (!cancelled) setDrawerLoading(false);
      }
    };
    loadSeason();

    return () => {
      cancelled = true;
    };
  }, [type, id, season, drawerSeason, episodeMenuOpen, initialEpisodes.length]);

  const armAutoHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3200);
  }, []);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setControlsVisible(false);
    }, 3500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Close popovers on click outside or Escape
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (popoverAreaRef.current && !popoverAreaRef.current.contains(e.target)) {
        setServerMenuOpen(false);
        setEpisodeMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setServerMenuOpen(false);
        setEpisodeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync fullscreen state with browser changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const element = playerRef.current;
    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) element.requestFullscreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
      else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
      else if (element.msRequestFullscreen) element.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  };

  // Add to history on mount/change
  useEffect(() => {
    if (isLoaded) {
      addToHistory({
        id,
        media_type: type,
        title,
        name: title,
        backdrop_path: backdropPath,
        season,
        episode,
      });
    }
  }, [id, type, title, backdropPath, season, episode, isLoaded, addToHistory]);

  const showTopChrome = controlsVisible || serverMenuOpen || episodeMenuOpen || exhausted;
  const currentServerObj = VIDEO_SOURCES.find((s) => s.value === source) || VIDEO_SOURCES[0];
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const displayedEpisodes =
    Number(drawerSeason) === Number(season) && initialEpisodes.length > 0 && drawerEpisodes === initialEpisodes
      ? initialEpisodes
      : drawerEpisodes;

  const handleExitPlayer = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore fullscreen exit errors
    }
    exitWatchPlayer(router);
  }, [exitWatchPlayer, router]);

  return (
    <div
      ref={playerRef}
      onMouseMove={armAutoHide}
      onTouchStart={armAutoHide}
      className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none"
    >
      {/* Top Hover Sensor Strip — detects cursor approaching top edge even over cross-origin iframe */}
      {!showTopChrome && (
        <div
          onMouseEnter={armAutoHide}
          className="absolute top-0 inset-x-0 h-14 z-30"
        />
      )}

      {/* Auto-Hiding Netflix Top Control Bar */}
      <div
        ref={popoverAreaRef}
        onMouseEnter={() => clearTimeout(hideTimerRef.current)}
        onMouseLeave={armAutoHide}
        className={`absolute top-0 inset-x-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-5 bg-gradient-to-b from-black/90 via-black/55 to-transparent transition-opacity duration-300 ${
          showTopChrome ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Back Button & Title Metadata */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleExitPlayer}
            aria-label="Keluar dari pemutar"
            title="Kembali"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 hover:text-white hover:bg-white/15 transition-all active:scale-90 flex-shrink-0 cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg md:text-xl font-bold text-white truncate drop-shadow">
              {title}
            </h1>
            {type === 'tv' && (
              <p className="text-xs sm:text-sm text-zinc-300 truncate">
                <span className="font-bold text-white">B{season}:E{episode}</span>
                {episodeTitle ? ` "${episodeTitle}"` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Right: Episode Controls, Server Switcher Popover & Fullscreen */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Prev / Next Episode Quick Links (TV only) */}
          {type === 'tv' && prevEpisodeHref && (
            <Link
              href={prevEpisodeHref}
              replace
              title="Episode Sebelumnya"
              className="hidden sm:flex h-9 items-center gap-1 px-3 rounded-[4px] bg-black/65 hover:bg-white/20 border border-white/25 text-xs font-bold text-white backdrop-blur-md transition-colors"
            >
              <ChevronLeft size={15} />
              <span className="hidden lg:inline">Sebelumnya</span>
            </Link>
          )}

          {type === 'tv' && nextEpisodeHref && (
            <Link
              href={nextEpisodeHref}
              replace
              title="Episode Selanjutnya"
              className="flex h-9 items-center gap-1.5 px-3 sm:px-3.5 rounded-[4px] bg-white hover:bg-white/85 text-xs font-bold text-black transition-colors shadow"
            >
              <SkipForward size={14} className="fill-black" />
              <span className="hidden sm:inline">Ep. Selanjutnya</span>
            </Link>
          )}

          {/* In-Player Episode Selector Drawer Trigger (TV only) */}
          {type === 'tv' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setEpisodeMenuOpen((prev) => !prev);
                  setServerMenuOpen(false);
                }}
                title="Daftar Episode"
                className={`flex h-9 items-center gap-1.5 px-3 rounded-[4px] border text-xs font-bold backdrop-blur-md transition-colors cursor-pointer ${
                  episodeMenuOpen
                    ? 'bg-white text-black border-white'
                    : 'bg-black/65 hover:bg-white/20 text-white border-white/25'
                }`}
              >
                <ListVideo size={16} />
                <span className="hidden md:inline">Episode</span>
              </button>

              {episodeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-[310px] sm:w-[390px] max-h-[72vh] flex flex-col bg-[#181818]/98 border border-white/15 rounded-md shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-[#141414]">
                    <span className="text-xs sm:text-sm font-bold text-white">Pilih Episode</span>
                    <div className="flex items-center gap-2">
                      {validSeasons.length > 1 && (
                        <select
                          value={drawerSeason}
                          onChange={(e) => setDrawerSeason(Number(e.target.value))}
                          className="bg-[#262626] text-white text-xs font-bold px-2.5 py-1 rounded-[3px] border border-white/25 focus:outline-none cursor-pointer"
                        >
                          {validSeasons.map((s) => (
                            <option key={s.id} value={s.season_number}>
                              {s.name || `Bagian ${s.season_number}`}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => setEpisodeMenuOpen(false)}
                        className="text-zinc-400 hover:text-white p-1"
                        aria-label="Tutup daftar episode"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto divide-y divide-white/5 p-2">
                    {drawerLoading ? (
                      <div className="py-10 text-center text-xs text-zinc-400">Memuat episode...</div>
                    ) : (
                      displayedEpisodes.map((ep) => {
                        const isCurrent =
                          Number(drawerSeason) === Number(season) &&
                          Number(ep.episode_number) === Number(episode);

                        return (
                          <Link
                            key={ep.id}
                            href={`/watch/tv/${id}/${drawerSeason}/${ep.episode_number}`}
                            replace
                            onClick={() => setEpisodeMenuOpen(false)}
                            className={`flex items-center gap-3 p-2.5 rounded-[4px] transition-colors ${
                              isCurrent ? 'bg-white/15' : 'hover:bg-white/5'
                            }`}
                          >
                            <span className="w-5 text-center text-xs font-bold text-zinc-400 flex-shrink-0">
                              {ep.episode_number}
                            </span>
                            <div className="relative w-24 aspect-video bg-[#141414] rounded-[3px] overflow-hidden flex-shrink-0">
                              {ep.still_path ? (
                                <Image
                                  src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                  alt={ep.name}
                                  fill
                                  sizes="96px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[9px] text-zinc-600 font-bold">
                                  Ep {ep.episode_number}
                                </div>
                              )}
                              {isCurrent && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Play size={14} className="fill-white text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-grow">
                              <p className="text-xs font-bold text-white truncate">
                                {ep.name || `Episode ${ep.episode_number}`}
                              </p>
                              <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                {ep.overview || `Putar Episode ${ep.episode_number}`}
                              </p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Server Selector Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setServerMenuOpen((prev) => !prev);
                setEpisodeMenuOpen(false);
              }}
              title="Ganti Server Pemutar"
              className={`flex h-9 items-center gap-1.5 px-3 rounded-[4px] border text-xs font-bold backdrop-blur-md transition-colors cursor-pointer ${
                serverMenuOpen
                  ? 'bg-white text-black border-white'
                  : 'bg-black/65 hover:bg-white/20 text-white border-white/25'
              }`}
            >
              <Layers size={15} />
              <span className="hidden sm:inline">{currentServerObj.label}</span>
            </button>

            {serverMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-[#181818]/98 border border-white/15 rounded-md shadow-2xl overflow-hidden z-50">
                <div className="px-3.5 py-2.5 border-b border-white/10 bg-[#141414]">
                  <p className="text-xs font-bold text-white">Sumber Server Streaming</p>
                  <p className="text-[10px] text-zinc-400">Ganti jika video lambat atau tidak muncul</p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {VIDEO_SOURCES.map((s) => {
                    const active = s.value === source;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          selectSource(s.value);
                          setServerMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-white/15 text-white font-bold'
                            : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{s.optionLabel}</span>
                        {active && <Check size={14} className="text-[#E50914]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-black/65 hover:bg-white/20 border border-white/25 text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Floating Auto-Fallback Toast Notice */}
      {notice && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818]/95 border border-amber-500/40 shadow-xl text-xs font-semibold text-amber-300 pointer-events-none">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Full-Viewport Video Embed Iframe */}
      <iframe
        key={iframeKey}
        src={embedUrl}
        onLoad={handleFrameLoad}
        title={title}
        className="w-full h-full border-none bg-black"
        allowFullScreen={true}
        webkitallowfullscreen="true"
        mozallowfullscreen="true"
        allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
      />

      {/* All Servers Exhausted Recovery Overlay */}
      {exhausted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#141414]/95 px-6 text-center">
          <AlertTriangle size={32} className="text-[#E50914]" />
          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-white">Semua server gagal dimuat</p>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
              Penyedia pihak ketiga mungkin sedang sibuk atau diblokir jaringan Anda. Coba ulangi atau pilih server secara manual di kanan atas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-2 bg-white hover:bg-white/85 active:scale-95 text-black text-xs sm:text-sm font-bold px-6 h-10 rounded-[4px] transition-all cursor-pointer"
            >
              <RefreshCw size={15} />
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={handleExitPlayer}
              className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#383838] text-white text-xs sm:text-sm font-bold px-5 h-10 rounded-[4px] transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
