import { notFound } from 'next/navigation';
import DetailModalShell from '@/app/components/DetailModalShell';
import MediaDetailView from '@/app/components/MediaDetailView';
import { getTVDetailData } from '@/app/lib/mediaDetails';

export default async function TVInterceptedModal({ params }) {
  const resolvedParams = await params;
  const detail = await getTVDetailData(resolvedParams.id);

  if (!detail) {
    notFound();
  }

  return (
    <DetailModalShell>
      <MediaDetailView {...detail} isModal />
    </DetailModalShell>
  );
}
