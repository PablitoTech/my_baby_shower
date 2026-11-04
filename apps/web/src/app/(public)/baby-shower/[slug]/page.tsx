import { PublicBabyShowerPage } from '@/client/features/public-baby-shower';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicBabyShowerPage slug={slug} />;
}
