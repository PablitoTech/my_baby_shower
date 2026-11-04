/**
 * Límites de validación compartidos por frontend (formularios) y backend (DTOs).
 * Mantenerlos en un solo lugar evita reglas divergentes entre capas.
 */
export const VALIDATION = {
  PERSON_NAME_MAX: 100,
  BABY_NAME_MAX: 60,
  EVENT_DESCRIPTION_MAX: 1000,
  EMAIL_MAX: 254,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  GIFT_NAME_MAX: 120,
  GIFT_DESCRIPTION_MAX: 500,
  GIFT_QUANTITY_MIN: 1,
  GIFT_QUANTITY_MAX: 999,
  GUEST_NAME_MAX: 120,
  GUEST_MESSAGE_MAX: 500,
} as const;

/** Letras, números, punto, guion y guion bajo. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

/** Al menos una minúscula, una mayúscula y un número. */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const IMAGE_UPLOAD = {
  MAX_BYTES: 2 * 1024 * 1024,
  MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;
