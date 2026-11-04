'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../ui/reveal';
import { useTitle } from '../use-title';

const STEPS = [1, 2, 3, 4];
const PARENT_ITEMS = [
  { icon: '📊', n: 1 },
  { icon: '🎀', n: 2 },
  { icon: '💌', n: 3 },
  { icon: '🔒', n: 4 },
];
const GUEST_ITEMS = [
  { icon: '🔗', n: 1 },
  { icon: '🧸', n: 2 },
  { icon: '💬', n: 3 },
  { icon: '📱', n: 4 },
];

/* eslint-disable @next/next/no-img-element */
export function LandingPage() {
  const { t } = useTranslation();
  useTitle('nav.home');

  return (
    <div className="p-landing">
      {/* 1. Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy fade-up">
            <p className="eyebrow">{t('landing.hero.eyebrow')}</p>
            <h1>{t('landing.hero.title')}</h1>
            <p className="lead">{t('landing.hero.subtitle')}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" href="/register">{t('landing.hero.cta')}</Link>
              <Link className="btn btn-secondary btn-lg" href="/login">{t('landing.hero.secondary')}</Link>
            </div>
          </div>
          <div className="hero-art fade-up" style={{ animationDelay: '.15s' }}>
            <img src="/images/hero.svg" width={560} height={480} alt={t('landing.hero.imageAlt')} fetchPriority="high" />
          </div>
        </div>
        <div className="blob blob-pink" aria-hidden="true" />
        <div className="blob blob-mint" aria-hidden="true" />
      </section>

      {/* 2. Presentación */}
      <section className="section intro">
        <div className="container intro-grid">
          <Reveal as="img" src="/images/gifts.svg" width={400} height={320} alt={t('landing.intro.imageAlt')} loading="lazy" />
          <Reveal>
            <h2>{t('landing.intro.title')}</h2>
            <p className="lead">{t('landing.intro.text')}</p>
            <ul className="stats">
              <li><span aria-hidden="true">🎁</span>{t('landing.intro.stat1')}</li>
              <li><span aria-hidden="true">🙌</span>{t('landing.intro.stat2')}</li>
              <li><span aria-hidden="true">🌎</span>{t('landing.intro.stat3')}</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 3. Cómo funciona */}
      <section id="how" className="section how">
        <div className="container">
          <Reveal as="header" className="section-header">
            <h2>{t('landing.how.title')}</h2>
            <p>{t('landing.how.subtitle')}</p>
          </Reveal>
          <ol className="steps">
            {STEPS.map((n) => (
              <Reveal as="li" key={n} className="step" style={{ transitionDelay: `${n * 80}ms` }}>
                <span className="step-number" aria-hidden="true">{n}</span>
                <h3>{t(`landing.how.step${n}Title`)}</h3>
                <p>{t(`landing.how.step${n}Text`)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 4 y 5. Beneficios */}
      <section id="benefits" className="section benefits">
        <div className="container">
          <div className="benefit-block">
            <Reveal as="img" src="/images/parents.svg" width={400} height={320} alt={t('landing.parents.imageAlt')} loading="lazy" />
            <Reveal>
              <h2>{t('landing.parents.title')}</h2>
              <ul className="benefit-list">
                {PARENT_ITEMS.map((item) => (
                  <li key={item.n}>
                    <span className="benefit-icon parents" aria-hidden="true">{item.icon}</span>
                    <div>
                      <h3>{t(`landing.parents.item${item.n}Title`)}</h3>
                      <p>{t(`landing.parents.item${item.n}Text`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="benefit-block reverse">
            <Reveal as="img" src="/images/guests.svg" width={400} height={320} alt={t('landing.guests.imageAlt')} loading="lazy" />
            <Reveal>
              <h2>{t('landing.guests.title')}</h2>
              <ul className="benefit-list">
                {GUEST_ITEMS.map((item) => (
                  <li key={item.n}>
                    <span className="benefit-icon guests" aria-hidden="true">{item.icon}</span>
                    <div>
                      <h3>{t(`landing.guests.item${item.n}Title`)}</h3>
                      <p>{t(`landing.guests.item${item.n}Text`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6 y 7. Llamado a la acción */}
      <section className="section">
        <div className="container">
          <Reveal className="cta">
            <h2>{t('landing.cta.title')}</h2>
            <p>{t('landing.cta.text')}</p>
            <div className="hero-actions center">
              <Link className="btn btn-primary btn-lg" href="/register">{t('landing.cta.button')}</Link>
              <Link className="btn btn-secondary btn-lg" href="/login">{t('landing.cta.login')}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
