import { HttpErrorResponse } from '@angular/common/http';
import { errorCode, errorKey } from './api-error';

describe('errorKey', () => {
  it('usa el código de negocio devuelto por la API', () => {
    const err = new HttpErrorResponse({ status: 409, error: { code: 'RESERVATION_EXCEEDS_AVAILABLE' } });
    expect(errorKey(err)).toBe('errors.RESERVATION_EXCEEDS_AVAILABLE');
    expect(errorCode(err)).toBe('RESERVATION_EXCEEDS_AVAILABLE');
  });

  it('detecta errores de red', () => {
    expect(errorKey(new HttpErrorResponse({ status: 0 }))).toBe('errors.NETWORK');
  });

  it('ignora códigos desconocidos', () => {
    expect(errorKey(new HttpErrorResponse({ status: 500, error: { code: 'HACK' } }))).toBe('errors.INTERNAL_ERROR');
    expect(errorKey(new Error('x'))).toBe('errors.INTERNAL_ERROR');
  });
});
