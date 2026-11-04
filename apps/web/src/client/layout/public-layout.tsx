'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth';
import { Brand } from '../ui/brand';
import { LanguageSwitcher } from '../ui/language-switcher';

export function PublicLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="l-public">
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      <header className="site-header">
        <div className="container header-bar">
          <Brand />
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            aria-label={t(menuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav id="site-nav" className={`nav ${menuOpen ? 'open' : ''}`} aria-label={t('nav.mainNav')}>
            <Link href="/#how" onClick={() => setMenuOpen(false)}>{t('nav.howItWorks')}</Link>
            <Link href="/#benefits" onClick={() => setMenuOpen(false)}>{t('nav.benefits')}</Link>
            <LanguageSwitcher />
            {user ? (
              <Link className="btn btn-primary btn-sm" href="/dashboard">
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm" href="/login">
                  {t('nav.login')}
                </Link>
                <Link className="btn btn-primary btn-sm" href="/register">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Brand />
            <p className="tagline">{t('footer.tagline')}</p>
          </div>
          <div>
            <h3>{t('footer.product')}</h3>
            <ul>
              <li><Link href="/">{t('nav.home')}</Link></li>
              <li><Link href="/#how">{t('nav.howItWorks')}</Link></li>
              <li><Link href="/#benefits">{t('nav.benefits')}</Link></li>
            </ul>
          </div>
          <div>
            <h3>{t('footer.account')}</h3>
            <ul>
              <li><Link href="/register">{t('nav.register')}</Link></li>
              <li><Link href="/login">{t('nav.login')}</Link></li>
            </ul>
          </div>
          <div className="lang">
            <h3>{t('common.language')}</h3>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="container copyright">
          <span>
            © {year} My Baby Shower. {t('footer.rights')}
          </span>
          <span className="made-by">{t('footer.madeBy')}</span>
        </div>
      </footer>
    </div>
  );
}
