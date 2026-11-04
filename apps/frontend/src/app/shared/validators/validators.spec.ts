import { FormControl, FormGroup } from '@angular/forms';
import { integer, isoToLocal, localToIso, matchFields } from './validators';

describe('validators', () => {
  it('marca passwordMismatch cuando las contraseñas no coinciden', () => {
    const group = new FormGroup(
      { password: new FormControl('Abc12345'), confirmPassword: new FormControl('Otra1234') },
      { validators: matchFields('password', 'confirmPassword') },
    );
    expect(group.controls.confirmPassword.hasError('passwordMismatch')).toBe(true);
    group.controls.confirmPassword.setValue('Abc12345');
    expect(group.controls.confirmPassword.valid).toBe(true);
  });

  it('valida enteros', () => {
    expect(integer(new FormControl(3))).toBeNull();
    expect(integer(new FormControl(2.5))).toEqual({ integer: true });
  });

  it('convierte entre datetime-local e ISO sin perder la hora', () => {
    const local = '2026-12-20T16:30';
    expect(isoToLocal(localToIso(local))).toBe(local);
  });
});
