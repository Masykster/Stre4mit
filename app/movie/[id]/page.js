import { notFound, redirect } from 'next/navigation';
import MediaDetailView from '@/app/components/MediaDetailView';
import { getMovieDetailData } from '@/app/lib/mediaDetails';

export default async function MovieDetails({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Redirect legacy ?play=true links straight to the unified fullscreen player
  if (resolvedSearchParams?.play === 'true') {
    redirect(`/watch/movie/${resolvedParams.id}`);
  }

  const detail = await getMovieDetailData(resolvedParams.id);
  if (!detail) {
    notFound();
  }

  return <MediaDetailView {...detail} isModal={false} />;
}
