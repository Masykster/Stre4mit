"use client";

import { useApp } from '../context/AppContext';
import { Heart } from 'lucide-react';

export default function WatchlistButton({ item }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isLoaded } = useApp();
  
  if (!isLoaded) {
    return (
      <div className="h-11 w-11 rounded-full bg-zinc-900 animate-pulse border border-zinc-800" />
    );
  }

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const fav = isInWatchlist(item.id, mediaType);

  const handleToggle = () => {
    if (fav) {
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
        release_date: item.release_date || item.first_air_date
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={fav ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
      aria-pressed={fav}
      title={fav ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-150 active:scale-95 select-none ${
        fav
          ? 'border-zinc-100 bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
          : 'border-zinc-800 bg-transparent text-zinc-100 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      <Heart size={18} className={fav ? 'fill-red-600 text-red-600' : ''} />
    </button>
  );
}
