import { notFound } from 'next/navigation';
import PersonCollectionView from '@/app/components/PersonCollectionView';
import { getPersonDetailData } from '@/app/lib/mediaDetails';

export default async function PersonPage({ params }) {
  const resolvedParams = await params;
  const result = await getPersonDetailData(resolvedParams.id);

  if (!result) {
    notFound();
  }

  return <PersonCollectionView person={result.person} items={result.items} isModal={false} />;
}
