// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ERROR_CODES } from '@mbs/common';
import i18n from '@/i18n';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import { ApiClientError, errorKey } from './api';
import { isoToLocal, localToIso } from './dates';
import { GiftCard } from './ui/gift-card';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe('cliente', () => {
  it('es.json y en.json tienen las mismas claves y traducen todos los códigos de error', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
    for (const code of Object.keys(ERROR_CODES)) {
      expect((es.errors as Record<string, string>)[code]).toBeTruthy();
      expect((en.errors as Record<string, string>)[code]).toBeTruthy();
    }
  });

  it('convierte errores de la API en claves de traducción', () => {
    expect(errorKey(new ApiClientError(409, 'RESERVATION_EXCEEDS_AVAILABLE'))).toBe('errors.RESERVATION_EXCEEDS_AVAILABLE');
    expect(errorKey(new ApiClientError(0, 'NETWORK'))).toBe('errors.NETWORK');
    expect(errorKey(new ApiClientError(500, 'HACK'))).toBe('errors.INTERNAL_ERROR');
  });

  it('convierte fechas de datetime-local sin perder la hora', () => {
    expect(isoToLocal(localToIso('2026-12-20T16:30'))).toBe('2026-12-20T16:30');
  });

  it('GiftCard muestra nombre, estado traducido y progreso', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <GiftCard name="Pañales" description={null} categoryCode="HYGIENE" imageUrl={null} status="PARTIALLY_RESERVED" available={1} required={4} />
      </I18nextProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Pañales' })).toBeTruthy();
    expect(screen.getByText('Parcialmente reservado')).toBeTruthy();
    expect((container.querySelector('.bar span') as HTMLElement).style.width).toBe('75%');
  });
});
