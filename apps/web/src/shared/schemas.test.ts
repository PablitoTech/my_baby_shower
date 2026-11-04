import { createReservationSchema, giftFormSchema, registerSchema } from './schemas';
import { decodeMessage } from './messages';

const valid = {
  fatherName: ' Carlos ',
  motherName: 'Ana',
  babyName: 'Sofía',
  eventDate: '2027-01-15T15:00:00.000Z',
  email: ' ANA@Example.COM ',
  username: 'AnaYCarlos',
  password: 'Secreta123',
  confirmPassword: 'Secreta123',
};

describe('schemas', () => {
  it('normaliza y sanitiza el registro', () => {
    const r = registerSchema.parse({ ...valid, description: '  hola\u0000 ' });
    expect(r).toMatchObject({ fatherName: 'Carlos', email: 'ana@example.com', username: 'anaycarlos', description: 'hola' });
  });

  it('rechaza campos desconocidos y contraseñas débiles o distintas', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'ADMIN' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'abcdefgh', confirmPassword: 'abcdefgh' }).success).toBe(false);
    const mismatch = registerSchema.safeParse({ ...valid, confirmPassword: 'Otra1234' });
    expect(mismatch.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('codifica parámetros en los mensajes de validación', () => {
    const r = giftFormSchema.safeParse({ name: 'x'.repeat(200), description: '', categoryId: 'c', quantityRequired: 1 });
    expect(decodeMessage(r.error!.issues[0]!.message)).toEqual({ key: 'validation.maxlength', params: { max: 120 } });
  });

  it('la reserva solo acepta nombre, cantidad y mensaje opcional', () => {
    expect(createReservationSchema.parse({ guestName: ' Rosa ', quantity: 1, message: '' })).toEqual({ guestName: 'Rosa', quantity: 1 });
    expect(createReservationSchema.safeParse({ guestName: 'Rosa', guestEmail: 'rosa@example.com', quantity: 1 }).success).toBe(false);
  });
});
