import { BadRequestException, HttpStatus, Logger, type ArgumentsHost } from '@nestjs/common';
import { ApiException } from '../http/api.exception.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function host() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const h = { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
  return { h, res };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('devuelve el código de negocio de ApiException', () => {
    const { h, res } = host();
    filter.catch(new ApiException(HttpStatus.CONFLICT, 'RESERVATION_EXCEEDS_AVAILABLE'), h);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'RESERVATION_EXCEEDS_AVAILABLE' }));
  });

  it('agrupa errores de validación en details', () => {
    const { h, res } = host();
    filter.catch(new BadRequestException(['a', 'b']), h);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_FAILED', details: ['a', 'b'] }));
  });

  it('nunca expone detalles internos de errores inesperados', () => {
    const { h, res } = host();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    filter.catch(new Error('secreto: conexión a 10.0.0.1 falló'), h);
    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(body)).not.toContain('secreto');
    expect(body).not.toHaveProperty('stack');
  });
});
