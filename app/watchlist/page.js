"use client";

import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import { Heart, HeartOff } from 'lucide-react';
import Link from 'next/link';

export default function WatchlistPage() {
  const { watchlist, isLoaded } = useApp();

  if (!isLoaded) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2 select-none">
          <Heart className="text-red-500 fill-red-500" />
          Watchlist Saya
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-lg animate-pulse border border-zinc-850" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 min-h-[75vh]">
      <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2 select-none">
        <Heart className="text-red-650 fill-red-650" />
        Watchlist Saya
      </h1>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {watchlist.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <HeartOff className="text-zinc-600 w-14 h-14" />
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-zinc-350">Watchlist Anda Kosong</h2>
            <p className="text-zinc-550 text-xs max-w-xs leading-relaxed">
              Tandai film atau TV series favorit Anda untuk disimpan di sini.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-150 font-bold text-xs px-5 h-10 rounded-full transition-all active:scale-95 select-none"
          >
            Cari Konten Menarik
          </Link>
        </div>
      )}
    </div>
  );
}
