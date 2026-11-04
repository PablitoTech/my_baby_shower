import { Suspense } from 'react';
import { LoginPage } from '@/client/features/login';

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
