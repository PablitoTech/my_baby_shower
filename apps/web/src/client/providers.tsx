'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './auth';
import { LanguageProvider } from './language';
import { ConfirmProvider } from './ui/confirm';
import { ToastProvider } from './ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
