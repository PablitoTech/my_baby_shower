import { Suspense } from 'react';
import { ResetPasswordPage } from '@/client/features/reset-password';

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
