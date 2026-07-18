import { notFound } from 'next/navigation';
import MovieDetailClient from '../../components/MovieDetailClient';

async function getMovieData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits,recommendations,images`;
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
  const recommendations = (data.recommendations?.results || []).filter(item => !item.adult).slice(0, 6);

  const logos = data.images?.logos || [];
  const logo = logos.find(l => l.iso_639_1 === 'id') ||
               logos.find(l => l.iso_639_1 === 'en') ||
               logos[0];
  const logoUrl = logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;

  return (
    <MovieDetailClient
      data={data}
      title={title}
      rating={rating}
      year={year}
      runtime={runtime}
      genres={genres}
      overview={overview}
      cast={cast}
      recommendations={recommendations}
      logoUrl={logoUrl}
    />
  );
}
