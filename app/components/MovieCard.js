import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

export default function MovieCard({ item, priority = false }) {
  const id = item.id;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const releaseDate = item.release_date || item.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const href = `/${mediaType}/${id}`;

  return (
    <Link href={href} className="group block">
      {/* Poster Image Container */}
      <div className="relative w-full aspect-[2/3] bg-zinc-950 rounded-lg overflow-hidden">
        {item.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-xs font-semibold text-zinc-600">
            {title}
          </div>
        )}

        {/* Rating Badge */}
        {rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] md:text-xs font-bold text-yellow-500 z-10">
            <Star size={10} className="fill-yellow-500 text-yellow-500" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      <h3 className="mt-2 text-xs md:text-sm font-semibold text-zinc-100 group-hover:text-red-500 transition-colors truncate">
        {title}
        {year ? ` (${year})` : ''}
      </h3>
    </Link>
  );
}
