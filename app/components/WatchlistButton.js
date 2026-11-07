"use client";

import { useApp } from '../context/AppContext';
import { Plus, Check } from 'lucide-react';

export default function WatchlistButton({ item, size = 'md', className = '' }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isLoaded } = useApp();

  const sizeClasses =
    size === 'sm'
      ? 'h-8 w-8'
      : 'h-10 w-10 sm:h-11 sm:w-11';
  const iconSize = size === 'sm' ? 16 : 20;

  if (!isLoaded) {
    return (
      <div className={`${sizeClasses} rounded-full bg-[#2a2a2a]/70 animate-pulse border-2 border-zinc-600/50 ${className}`} />
    );
  }

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const inList = isInWatchlist(item.id, mediaType);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inList) {
      removeFromWatchlist(item.id, mediaType);
    } else {
      addToWatchlist({
        id: item.id,
        title: item.title || item.name,
        name: item.name || item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        media_type: mediaType,
        vote_average: item.vote_average,
        genre_ids: item.genre_ids || (item.genres ? item.genres.map((g) => g.id) : []),
        release_date: item.release_date || item.first_air_date,
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={inList ? 'Hapus dari Daftar Saya' : 'Tambahkan ke Daftar Saya'}
      aria-pressed={inList}
      title={inList ? 'Hapus dari Daftar Saya' : 'Tambahkan ke Daftar Saya'}
      className={`flex items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90 select-none cursor-pointer ${sizeClasses} ${
        inList
          ? 'border-white bg-white/15 text-white hover:bg-white/25'
          : 'border-zinc-400/80 bg-[#2a2a2a]/70 text-zinc-100 hover:border-white hover:bg-[#2a2a2a]'
      } ${className}`}
    >
      {inList ? <Check size={iconSize} strokeWidth={2.5} /> : <Plus size={iconSize} strokeWidth={2.5} />}
    </button>
  );
}
