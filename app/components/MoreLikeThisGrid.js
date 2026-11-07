"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import WatchlistButton from './WatchlistButton';
import { getMatchScore, getMaturityBadge } from '../lib/genres';

export default function MoreLikeThisGrid({ items, mediaType = 'movie' }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4 pt-10 border-t border-white/10">
      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
        Lainnya Seperti Ini
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => {
          const type = item.media_type || mediaType;
          const title = item.title || item.name;
          const year = (item.release_date || item.first_air_date || '').split('-')[0];
          const matchScore = getMatchScore(item.vote_average);
          const maturity = getMaturityBadge(item);
          const thumb = item.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
            : item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null;
          const detailHref = `/${type}/${item.id}`;

          return (
            <div
              key={`${type}-${item.id}`}
              className="group flex flex-col bg-[#2f2f2f]/65 hover:bg-[#353535]/80 rounded-[4px] overflow-hidden transition-colors"
            >
              {/* Top 16:9 Backdrop */}
              <Link href={detailHref} className="relative w-full aspect-video bg-[#181818] overflow-hidden block">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-xs text-zinc-500 font-bold text-center">
                    {title}
                  </div>
                )}

                {year && (
                  <span className="absolute top-2.5 right-2.5 text-xs font-bold text-zinc-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    {year}
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-2.5 left-3 right-3 text-xs sm:text-sm font-bold text-white line-clamp-1 drop-shadow">
                  {title}
                </span>

                {/* Play hover ring */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-11 w-11 rounded-full bg-black/65 border-2 border-white flex items-center justify-center text-white">
                    <Play size={18} className="fill-white translate-x-0.5" />
                  </div>
                </div>
              </Link>

              {/* Metadata & Synopsis */}
              <div className="p-4 flex flex-col gap-3 flex-grow">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {matchScore && (
                      <span className="text-emerald-400 font-bold">{matchScore}% Cocok</span>
                    )}
                    <span className="border border-zinc-500 px-1.5 py-px text-[10px] text-zinc-200">
                      {maturity}
                    </span>
                    <span className="border border-zinc-500/80 rounded-[2px] px-1 text-[9px] text-zinc-300 font-bold">
                      HD
                    </span>
                  </div>

                  <WatchlistButton item={{ ...item, media_type: type }} size="sm" />
                </div>

                <p className="text-xs text-zinc-300/85 line-clamp-3 leading-relaxed">
                  {item.overview || 'Klik untuk melihat detail lengkap dan mulai menonton tayangan ini.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
