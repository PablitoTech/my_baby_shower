'use client';

import type { ReactNode } from 'react';
import type { Language } from '@mbs/common';
import { AuthProvider } from './auth';
import { LanguageProvider } from './language';
import { ConfirmProvider } from './ui/confirm';
import { ToastProvider } from './ui/toast';

export function Providers({ language, children }: { language: Language; children: ReactNode }) {
  return (
    <LanguageProvider initialLanguage={language}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
