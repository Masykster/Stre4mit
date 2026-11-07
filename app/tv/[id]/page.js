import { notFound } from 'next/navigation';
import MediaDetailView from '@/app/components/MediaDetailView';
import { getTVDetailData } from '@/app/lib/mediaDetails';

export default async function TVDetails({ params }) {
  const resolvedParams = await params;
  const detail = await getTVDetailData(resolvedParams.id);

  if (!detail) {
    notFound();
  }

  return <MediaDetailView {...detail} isModal={false} />;
}
