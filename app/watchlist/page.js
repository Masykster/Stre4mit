"use client";

import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function WatchlistPage() {
  const { watchlist, isLoaded } = useApp();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-20 px-4 md:px-12 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white select-none">
          Daftar Saya
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-video bg-[#202020] rounded-[4px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-20 px-4 md:px-12 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-white select-none">
        Daftar Saya
      </h1>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {watchlist.map((item) => (
            <MovieCard key={`${item.media_type || 'movie'}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-28 text-center space-y-4">
          <div className="h-14 w-14 rounded-full border-2 border-zinc-600 flex items-center justify-center text-zinc-500">
            <Plus size={26} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-zinc-200">
              Anda belum menambahkan judul apa pun ke Daftar Saya.
            </h2>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
              Tekan tombol <span className="text-white font-bold">+</span> pada kartu film atau acara TV untuk menyimpannya di sini agar mudah ditonton nanti.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center bg-white hover:bg-white/85 text-black font-bold text-xs px-6 h-10 rounded-[4px] transition-all active:scale-95 select-none"
          >
            Telusuri Konten
          </Link>
        </div>
      )}
    </div>
  );
}
