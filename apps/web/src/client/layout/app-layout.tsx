'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth';
import { Brand } from '../ui/brand';
import { LanguageSwitcher } from '../ui/language-switcher';

const LINKS = [
  { href: '/dashboard', key: 'nav.dashboard', icon: '🏡' },
  { href: '/gifts', key: 'nav.gifts', icon: '🎁' },
  { href: '/reservations', key: 'nav.reservations', icon: '📋' },
  { href: '/event', key: 'nav.event', icon: '🗓️' },
];

/** Layout privado: exige sesión y redirige a /login conservando la URL de destino. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="l-app">
        <p className="container content" role="status">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="l-app">
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      <header className="topbar">
        <div className="container header-bar">
          <Brand href="/dashboard" />
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="app-nav"
            aria-label={t(menuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav id="app-nav" className={`nav ${menuOpen ? 'open' : ''}`} aria-label={t('nav.mainNav')}>
            <ul>
              {LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link href={link.href} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
                      <span aria-hidden="true">{link.icon}</span> {t(link.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="tools">
              <LanguageSwitcher />
              <span className="user" title={user.email}>
                @{user.username}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void logout()}>
                {t('nav.logout')}
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main id="main" className="container content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
