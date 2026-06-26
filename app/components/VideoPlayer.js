"use client";

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Maximize2, Minimize2, ArrowLeft, ChevronLeft, ChevronRight, Tv } from 'lucide-react';
import Link from 'next/link';

export default function VideoPlayer({ id, type, title, backdropPath, season, episode, nextEpisodeHref, prevEpisodeHref }) {
  const { addToHistory, isLoaded } = useApp();
  const [theaterMode, setTheaterMode] = useState(false);
  // ponytail: sandbox with allow-top-navigation-by-user-activation blocks auto-redirects without triggering sbx.html 404
  const [source, setSource] = useState('vidsrc-embed.ru');
  const playerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement || 
           document.webkitFullscreenElement || 
           document.mozFullScreenElement || 
           document.msFullscreenElement)
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
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
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
  }, [id, type, title, backdropPath, season, episode, isLoaded]);

  const embedUrl = source === 'vidsrc-embed.ru'
    ? (type === 'tv'
        ? `https://vidsrc-embed.ru/embed/tv/${id}/${season}-${episode}`
        : `https://vidsrc-embed.ru/embed/movie/${id}`)
    : source === 'vidlink.pro'
    ? (type === 'tv'
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=dc2626&secondaryColor=18181b&iconColor=dc2626&icons=vid&nextbutton=true`
        : `https://vidlink.pro/movie/${id}?primaryColor=dc2626&secondaryColor=18181b&iconColor=dc2626&icons=vid`)
    : source === 'videasy'
    ? (type === 'tv'
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}?color=dc2626&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true`
        : `https://player.videasy.net/movie/${id}?color=dc2626&overlay=true`)
    : (type === 'tv' 
        ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${id}`);

  return (
    <div className={`space-y-6 ${theaterMode ? 'w-full max-w-full' : 'max-w-5xl mx-auto px-4'}`}>
      {/* Player Header */}
      {!theaterMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={type === 'tv' ? `/tv/${id}` : `/movie/${id}`} className="text-zinc-400 hover:text-zinc-100 p-2 rounded-full hover:bg-zinc-900 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white leading-tight">
                {title}
              </h1>
              {type === 'tv' && (
                <p className="text-xs md:text-sm text-red-500 font-bold mt-0.5">
                  Musim {season}, Episode {episode}
                </p>
              )}
            </div>
          </div>

          {/* Server Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-semibold hidden sm:inline">Server:</span>
            <select
              id="source-selector"
              name="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-zinc-900 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-655 cursor-pointer"
            >
              <option value="vidsrc-embed.ru">Vidsrc-embed.ru</option>
              <option value="vidlink.pro">Vidlink.pro</option>
              <option value="videasy">Videasy.net</option>
              <option value="vidsrc.to">Vidsrc.to</option>
            </select>
          </div>
        </div>
      )}

      {/* Actual Player Wrapper */}
      <div 
        ref={playerRef}
        className={`relative w-full bg-black border border-zinc-900 overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullscreen 
            ? 'h-screen w-screen border-none rounded-none' 
            : theaterMode 
            ? 'h-[75vh] border-x-0' 
            : 'aspect-video rounded-xl'
        }`}
      >
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-none"
          allowFullScreen={true}
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          referrerPolicy="no-referrer"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        />

        {/* Floating Overlay Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          {/* Theater mode button */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className={`p-2.5 rounded-full border transition-colors h-11 w-11 flex items-center justify-center active:scale-95 ${
              theaterMode 
                ? 'bg-red-950/80 text-red-400 border-red-900/50 hover:bg-red-900' 
                : 'bg-black/60 text-white border-zinc-800/80 hover:bg-black/95'
            }`}
            title={theaterMode ? "Keluar Mode Bioskop" : "Mode Bioskop"}
          >
            <Tv size={16} />
          </button>
          
          {/* Custom Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="bg-black/60 text-white p-2.5 rounded-full hover:bg-black/95 transition-colors border border-zinc-800/80 h-11 w-11 flex items-center justify-center active:scale-95"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Control Navigation & Extra details */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${theaterMode ? 'px-6 pb-6' : ''}`}>
        {/* Episode navigation controls (TV shows only) */}
        {type === 'tv' ? (
          <div className="flex items-center gap-3">
            {prevEpisodeHref ? (
              <Link
                href={prevEpisodeHref}
                className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white px-4 h-11 rounded-full text-xs font-bold transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </Link>
            ) : (
              <button disabled className="flex items-center gap-1 bg-zinc-950 border border-zinc-900 text-zinc-600 px-4 h-11 rounded-full text-xs font-bold cursor-not-allowed">
                <ChevronLeft size={16} />
                Sebelumnya
              </button>
            )}

            {nextEpisodeHref ? (
              <Link
                href={nextEpisodeHref}
                className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white px-4 h-11 rounded-full text-xs font-bold transition-all active:scale-95"
              >
                Selanjutnya
                <ChevronRight size={16} />
              </Link>
            ) : (
              <button disabled className="flex items-center gap-1 bg-zinc-950 border border-zinc-900 text-zinc-600 px-4 h-11 rounded-full text-xs font-bold cursor-not-allowed">
                Selanjutnya
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Action Toggle if in theater mode */}
        {theaterMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheaterMode(false)}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 h-11 rounded-full text-xs font-bold transition-all active:scale-95"
            >
              Normal View
            </button>
            <select
              id="source-selector-theater"
              name="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-zinc-900 text-zinc-300 text-xs font-semibold px-4 h-11 rounded-full border border-zinc-800 focus:outline-none focus:border-red-650 cursor-pointer"
            >
              <option value="vidsrc-embed.ru">Server 1 (vidsrc-embed.ru)</option>
              <option value="vidlink.pro">Server 2 (vidlink.pro)</option>
              <option value="videasy">Server 3 (videasy.net)</option>
              <option value="vidsrc.to">Server 4 (vidsrc.to)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
