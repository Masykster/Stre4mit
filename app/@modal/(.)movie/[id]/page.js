import { notFound, redirect } from 'next/navigation';
import DetailModalShell from '@/app/components/DetailModalShell';
import MediaDetailView from '@/app/components/MediaDetailView';
import { getMovieDetailData } from '@/app/lib/mediaDetails';

export default async function MovieInterceptedModal({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  if (resolvedSearchParams?.play === 'true') {
    redirect(`/watch/movie/${resolvedParams.id}`);
  }

  const detail = await getMovieDetailData(resolvedParams.id);
  if (!detail) {
    notFound();
  }

  return (
    <DetailModalShell>
      <MediaDetailView {...detail} isModal />
    </DetailModalShell>
  );
}
