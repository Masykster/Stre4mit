"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Clock, Calendar, X } from 'lucide-react';
import WatchlistButton from './WatchlistButton';
import MovieCard from './MovieCard';
import { useApp } from '../context/AppContext';

export default function MovieDetailClient({
  data,
  title,
  rating,
  year,
  runtime,
  genres,
  overview,
  cast,
  recommendations,
  logoUrl,
}) {
  const { addToHistory, isLoaded } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [source, setSource] = useState('vidsrc-embed.ru');

  // Add to watch history when playing starts
  useEffect(() => {
    if (isPlaying && isLoaded) {
      addToHistory({
        id: data.id,
        media_type: 'movie',
        title,
        name: title,
        backdrop_path: data.backdrop_path,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isLoaded]);

  const handlePlay = () => {
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const embedUrl = source === 'vidsrc-embed.ru'
    ? `https://vidsrc-embed.ru/embed/movie/${data.id}`
    : source === 'vidlink.pro'
    ? `https://vidlink.pro/movie/${data.id}?primaryColor=dc2626&secondaryColor=18181b&iconColor=dc2626&icons=vid`
    : source === 'videasy'
    ? `https://player.videasy.net/movie/${data.id}?color=dc2626&overlay=true`
    : source === 'superembed'
    ? `https://multiembed.mov/?video_id=${data.id}&tmdb=1`
    : source === 'smashystream'
    ? `https://embed.smashystream.com/playere.php?tmdb=${data.id}`
    : source === '2embed'
    ? `https://www.2embed.cc/embed/${data.id}`
    : `https://vidsrc.to/embed/movie/${data.id}`;

  return (
    <div className="relative min-h-screen pb-16 bg-black text-zinc-100">
      {/* Backdrop / Player Area */}
      <div
        className={
          isPlaying
            ? 'relative w-full bg-black z-20'
            : 'absolute top-0 left-0 right-0 h-[60vh] overflow-hidden select-none z-0'
        }
      >
        {isPlaying ? (
          /* ── Video Player ── */
          <div className="max-w-6xl mx-auto px-4 pt-20 pb-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-900">
              <iframe
                key={source}
                src={embedUrl}
                title={title}
                className="w-full h-full border-none"
                allowFullScreen={true}
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
              />
              {/* Close player button */}
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-30 active:scale-95 border border-zinc-700/50"
                title="Tutup Player"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* ── Backdrop ── */
          <>
            {data.backdrop_path && (
              <>
                <Image
                  src={`https://image.tmdb.org/t/p/w1280${data.backdrop_path}`}
                  alt={title}
                  fill
                  priority
                  className="object-cover opacity-30 blur-xs"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              </>
            )}
          </>
        )}
      </div>

      {/* Content Container */}
      <div className={`relative z-10 max-w-6xl mx-auto px-4 ${isPlaying ? 'pt-8' : 'pt-10 sm:pt-16'}`}>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left: Poster */}
          <div className="relative w-44 sm:w-60 aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800/80 mx-auto md:mx-0 flex-shrink-0">
            {data.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                alt={title}
                fill
                sizes="(max-width: 768px) 176px, 240px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-550 font-bold p-4 text-center">
                {title}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex-grow space-y-6 text-center md:text-left">
            <div className="space-y-3">
              {/* Title / Logo */}
              {logoUrl ? (
                <div className="relative h-20 md:h-28 w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] mx-auto md:mx-0 select-none">
                  <Image
                    src={logoUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 340px, 400px"
                    className="object-contain object-center md:object-left"
                    priority
                  />
                </div>
              ) : (
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  {title}
                </h1>
              )}

              {/* Meta information row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs md:text-sm font-semibold text-zinc-300">
                {rating && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} className="fill-yellow-500 text-yellow-500" />
                    <span>{rating}</span>
                  </div>
                )}
                {year && (
                  <Link href={`/discover?type=movie&year=${year}`} className="flex items-center gap-1 hover:text-red-500 transition-colors duration-150">
                    <Calendar size={16} className="text-zinc-500" />
                    <span>{year}</span>
                  </Link>
                )}
                {runtime && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-zinc-500" />
                    <span>{runtime}</span>
                  </div>
                )}
              </div>

              {/* Genres badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {genres.map((g) => (
                  <Link key={g.id} href={`/discover?genre=${g.id}&genreName=${encodeURIComponent(g.name)}`} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full hover:bg-red-950 hover:border-red-900 hover:text-red-400 transition-colors duration-150">
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={handlePlay}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm md:text-base px-8 h-11 rounded-full transition-all duration-150"
              >
                <Play size={18} className="fill-white" />
                {isPlaying ? 'Kembali ke Player' : 'Nonton Sekarang'}
              </button>
              <div className="w-full sm:w-auto">
                <WatchlistButton item={data} />
              </div>
              {/* Server Selector — far right */}
              <select
                id="movie-source-selector"
                name="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full sm:w-auto sm:ml-auto bg-zinc-900 text-zinc-300 text-xs font-semibold px-4 h-11 rounded-full border border-zinc-800 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="vidsrc-embed.ru">Server 1 (vidsrc-embed.ru)</option>
                <option value="vidlink.pro">Server 2 (vidlink.pro)</option>
                <option value="videasy">Server 3 (videasy.net)</option>
                <option value="superembed">Server 4 (superembed.mov)</option>
                <option value="smashystream">Server 5 (smashystream)</option>
                <option value="2embed">Server 6 (2embed.cc)</option>
                <option value="vidsrc.to">Server 7 (vidsrc.to)</option>
              </select>
            </div>

            {/* Overview / Synopsis */}
            <div className="space-y-2 text-left">
              <h2 className="text-base sm:text-lg font-bold text-zinc-200">Sinopsis</h2>
              <p className="text-zinc-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl">
                {overview}
              </p>
            </div>

            {/* Cast & Crew Section */}
            {cast.length > 0 && (
              <div className="space-y-3 pt-2 text-left">
                <h2 className="text-base sm:text-lg font-bold text-zinc-200">Pemeran Utama</h2>
                <div className="flex flex-wrap justify-start gap-4">
                  {cast.map((c) => (
                    <div key={c.id} className="flex flex-col items-center w-20 text-center gap-1.5">
                      <div className="relative w-12 h-12 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 flex-shrink-0">
                        {c.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                            alt={c.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[8px] text-zinc-650 font-bold">
                            No Pic
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 w-full">
                        <p className="text-[10px] font-bold text-zinc-200 truncate">{c.name}</p>
                        <p className="text-[9px] text-zinc-500 truncate">{c.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="space-y-4 mt-16 pt-10 border-t border-zinc-900">
            <h2 className="text-lg md:text-xl font-bold text-white">Rekomendasi Terkait</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {recommendations.map((item) => (
                <MovieCard key={item.id} item={{ ...item, media_type: 'movie' }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
