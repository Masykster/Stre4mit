import { notFound } from 'next/navigation';
import DetailModalShell from '@/app/components/DetailModalShell';
import PersonCollectionView from '@/app/components/PersonCollectionView';
import { getPersonDetailData } from '@/app/lib/mediaDetails';

export default async function PersonInterceptedModal({ params }) {
  const resolvedParams = await params;
  const result = await getPersonDetailData(resolvedParams.id);

  if (!result) {
    notFound();
  }

  return (
    <DetailModalShell>
      <PersonCollectionView person={result.person} items={result.items} isModal />
    </DetailModalShell>
  );
}
