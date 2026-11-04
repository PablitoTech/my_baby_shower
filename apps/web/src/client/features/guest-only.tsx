'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../auth';

/** Evita que un usuario autenticado vea login/registro. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);
  return user ? null : <>{children}</>;
}
