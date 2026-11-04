import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida que dos controles de un grupo coincidan (p. ej. contraseña y confirmación). */
export function matchFields(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const confirm = group.get(confirmField);
    if (!confirm) return null;
    const mismatch = group.get(field)?.value !== confirm.value;
    const errors = { ...(confirm.errors ?? {}) };
    if (mismatch && confirm.value) {
      errors['passwordMismatch'] = true;
    } else {
      delete errors['passwordMismatch'];
    }
    confirm.setErrors(Object.keys(errors).length ? errors : null, { emitEvent: true });
    return null;
  };
}

export const integer: ValidatorFn = (control) =>
  control.value === null || control.value === '' || Number.isInteger(Number(control.value)) ? null : { integer: true };

/** Convierte un valor de <input type="datetime-local"> a ISO 8601. */
export function localToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Convierte una fecha ISO al formato de <input type="datetime-local"> en hora local. */
export function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
