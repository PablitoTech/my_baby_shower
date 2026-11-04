import { Suspense } from 'react';
import { ReservationsPage } from '@/client/features/reservations';

export default function Page() {
  return (
    <Suspense>
      <ReservationsPage />
    </Suspense>
  );
}
