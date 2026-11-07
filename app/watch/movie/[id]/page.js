import { notFound } from 'next/navigation';
import VideoPlayer from '../../../components/VideoPlayer';
import { normalizeTMDbPayload, resolveReadableTitle } from '@/app/lib/romanize';

async function getMovieData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  try {
    const [enRes, idRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`, {
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=id-ID`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!enRes.ok) return null;
    const enData = await enRes.json();
    const idData = idRes.ok ? await idRes.json() : null;

    return normalizeTMDbPayload({
      ...enData,
      title: resolveReadableTitle(idData?.title, enData.title, enData.original_title),
    });
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
