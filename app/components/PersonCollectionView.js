"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';
import MovieCard from './MovieCard';

export default function PersonCollectionView({ person, items = [], isModal = false }) {
  const [filterType, setFilterType] = useState('all');
  const [bioExpanded, setBioExpanded] = useState(false);

  const movieCount = items.filter((i) => i.media_type === 'movie').length;
  const tvCount = items.filter((i) => i.media_type === 'tv').length;

  const filteredItems = items.filter((item) => {
    if (filterType === 'movie') return item.media_type === 'movie';
    if (filterType === 'tv') return item.media_type === 'tv';
    return true;
  });

  return (
    <div
      className={
        isModal
          ? 'bg-[#181818] text-zinc-100 p-5 sm:p-10 space-y-8 min-h-[420px]'
          : 'min-h-screen bg-[#141414] text-zinc-100 pt-24 pb-20 px-4 md:px-12 space-y-8'
      }
    >
      {!isModal && (
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      )}

      {/* Netflix Collection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-white/10 pr-8">
        {person.profile_path && (
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-[#242424] ring-2 ring-white/15 flex-shrink-0">
            <Image
              src={`https://image.tmdb.org/t/p/w342${person.profile_path}`}
              alt={person.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#E50914]">
            <span>Koleksi Tayangan</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{person.department}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            {person.name}
          </h1>

          {person.biography && (
            <div className="max-w-3xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p className={bioExpanded ? '' : 'line-clamp-2'}>{person.biography}</p>
              {person.biography.length > 180 && (
                <button
                  type="button"
                  onClick={() => setBioExpanded((prev) => !prev)}
                  className="mt-1 text-xs font-bold text-white hover:underline cursor-pointer"
                >
                  {bioExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `Semua (${items.length})` },
            { id: 'movie', label: `Film (${movieCount})` },
            { id: 'tv', label: `Acara TV (${tvCount})` },
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-black'
                    : 'bg-[#2a2a2a] text-zinc-300 hover:bg-[#383838] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collection Grid */}
      {filteredItems.length > 0 ? (
        <div
          className={
            isModal
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5'
              : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4'
          }
        >
          {filteredItems.map((item) => (
            <MovieCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              replaceNavigation={isModal}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2 text-zinc-400">
          <Film className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="text-sm font-semibold">Belum ada tayangan yang tersedia untuk kategori ini.</p>
        </div>
      )}
    </div>
  );
}
