import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { Providers } from '@/client/providers';
import { LANGUAGE_COOKIE, resolveLanguage } from '@/i18n';
import '@/styles/globals.scss';

const nunito = Nunito({ subsets: ['latin', 'latin-ext'], weight: ['400', '600', '700'], variable: '--font-nunito', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin', 'latin-ext'], weight: ['500', '600'], variable: '--font-fredoka', display: 'swap' });

export const metadata: Metadata = {
  title: 'My Baby Shower',
  description: 'Organiza tu Baby Shower, crea tu lista de regalos y compártela con tus invitados.',
  icons: { icon: '/images/logo.svg' },
};

export const viewport: Viewport = { themeColor: '#FFFBF6', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const language = resolveLanguage((await cookies()).get(LANGUAGE_COOKIE)?.value);
  return (
    <html lang={language} data-scroll-behavior="smooth" className={`${nunito.variable} ${fredoka.variable}`}>
      <body>
        <Providers language={language}>{children}</Providers>
      </body>
    </html>
  );
}
