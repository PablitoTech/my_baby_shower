import { Transform } from 'class-transformer';

// Caracteres de control (excepto salto de línea y tabulador).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Sanitiza texto libre: elimina caracteres de control y espacios sobrantes. */
export function SanitizeText() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.replace(CONTROL_CHARS, '').trim() : value,
  );
}

/** Igual que SanitizeText, convirtiendo cadenas vacías en undefined (campos opcionales). */
export function SanitizeOptionalText() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const clean = value.replace(CONTROL_CHARS, '').trim();
    return clean === '' ? undefined : clean;
  });
}

export function ToLowerCase() {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
}
