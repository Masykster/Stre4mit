import { notFound, redirect } from 'next/navigation';
import MovieDetailClient from '../../components/MovieDetailClient';

async function getMovieData(id) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') return null;

  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=id-ID&append_to_response=credits,recommendations,images,videos&include_image_language=id,en,null&include_video_language=id,en,null`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();

    // Fallback to English overview if Indonesian synopsis is empty
    if (!data.overview) {
      const enRes = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`,
        { next: { revalidate: 3600 } }
      );
      if (enRes.ok) {
        const enData = await enRes.json();
        data.overview = enData.overview || '';
        data.tagline = data.tagline || enData.tagline || '';
      }
    }

    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function MovieDetails({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Redirect legacy ?play=true links straight to the unified fullscreen player
  if (resolvedSearchParams?.play === 'true') {
    redirect(`/watch/movie/${resolvedParams.id}`);
  }

  const data = await getMovieData(resolvedParams.id);
  if (!data) {
    notFound();
  }

  const title = data.title;
  const year = data.release_date ? data.release_date.split('-')[0] : '';
  const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}j ${data.runtime % 60}m` : '';
  const genres = data.genres || [];
  const overview = data.overview || 'Sinopsis belum tersedia.';
  const cast = data.credits?.cast?.slice(0, 14) || [];
  const director = data.credits?.crew?.find((c) => c.job === 'Director')?.name || '';
  const recommendations = (data.recommendations?.results || [])
    .filter((item) => !item.adult && (item.backdrop_path || item.poster_path))
    .slice(0, 9);

  const logos = data.images?.logos || [];
  const logo =
    logos.find((l) => l.iso_639_1 === 'id') ||
    logos.find((l) => l.iso_639_1 === 'en') ||
    logos[0];
  const logoUrl = logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;

  const videos = data.videos?.results || [];
  const youtubeVideo =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  return (
    <MovieDetailClient
      data={data}
      title={title}
      year={year}
      runtime={runtime}
      genres={genres}
      overview={overview}
      cast={cast}
      director={director}
      recommendations={recommendations}
      logoUrl={logoUrl}
      trailerKey={youtubeVideo?.key || null}
    />
  );
}
