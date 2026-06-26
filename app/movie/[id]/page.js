import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Play, Star, Clock, Calendar } from 'lucide-react';
import WatchlistButton from '../../components/WatchlistButton';
import MovieCard from '../../components/MovieCard';

async function getMovieData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits,recommendations`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function MovieDetails({ params }) {
  const resolvedParams = await params;
  const data = await getMovieData(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const title = data.title;
  const rating = data.vote_average ? data.vote_average.toFixed(1) : null;
  const year = data.release_date ? data.release_date.split('-')[0] : '';
  const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}j ${data.runtime % 60}m` : '';
  const genres = data.genres || [];
  const overview = data.overview || 'Sinopsis belum tersedia.';
  const cast = data.credits?.cast?.slice(0, 6) || [];
  const recommendations = data.recommendations?.results?.slice(0, 6) || [];
  const watchUrl = `/watch/movie/${data.id}`;

  return (
    <div className="relative min-h-screen pb-16 bg-black text-zinc-100">
      {/* Blurred Backdrop Background */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] overflow-hidden select-none z-0">
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
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 sm:pt-16">
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
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                {title}
              </h1>

              {/* Meta information row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs md:text-sm font-semibold text-zinc-300">
                {rating && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} className="fill-yellow-500 text-yellow-500" />
                    <span>{rating}</span>
                  </div>
                )}
                {year && (
                  <div className="flex items-center gap-1">
                    <Calendar size={16} className="text-zinc-500" />
                    <span>{year}</span>
                  </div>
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
                  <span key={g.id} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 pt-2">
              <Link
                href={watchUrl}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm md:text-base px-8 h-11 rounded-full transition-all duration-150"
              >
                <Play size={18} className="fill-white" />
                Nonton Sekarang
              </Link>
              <div className="w-full sm:w-auto">
                <WatchlistButton item={data} />
              </div>
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
