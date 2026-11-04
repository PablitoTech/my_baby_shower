import { NotFoundView } from '@/client/features/not-found';
import { PublicLayout } from '@/client/layout/public-layout';

export default function NotFound() {
  return (
    <PublicLayout>
      <NotFoundView />
    </PublicLayout>
  );
}
