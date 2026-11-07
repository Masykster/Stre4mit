import { notFound } from 'next/navigation';
import VideoPlayer from '../../../components/VideoPlayer';

async function getMovieData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=id-ID`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function WatchMovie({ params }) {
  const resolvedParams = await params;
  const data = await getMovieData(resolvedParams.id);
  if (!data) notFound();

  return (
    <VideoPlayer
      id={data.id}
      type="movie"
      title={data.title}
      backdropPath={data.backdrop_path}
    />
  );
}
