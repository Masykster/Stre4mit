"use client";

import { useApp } from '../context/AppContext';
import { Heart } from 'lucide-react';

export default function WatchlistButton({ item }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isLoaded } = useApp();
  
  if (!isLoaded) {
    return (
      <div className="h-11 w-32 rounded-full bg-zinc-900 animate-pulse border border-zinc-800" />
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
      onClick={handleToggle}
      className={`flex items-center justify-center gap-2 h-11 px-5 rounded-full border text-sm font-bold transition-all duration-150 active:scale-95 select-none ${
        fav 
          ? 'bg-zinc-100 text-zinc-900 border-zinc-100 hover:bg-zinc-200' 
          : 'bg-transparent text-zinc-100 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
      }`}
    >
      <Heart size={18} className={fav ? 'fill-red-600 text-red-600' : ''} />
      {fav ? 'Dalam Watchlist' : 'Tambah ke Watchlist'}
    </button>
  );
}
