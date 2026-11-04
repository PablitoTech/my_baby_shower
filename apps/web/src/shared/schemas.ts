/**
 * Esquemas de validación (zod) compartidos por formularios y API.
 * El servidor siempre vuelve a validar: nunca confía en el cliente.
 */
import { z } from 'zod';
import { PASSWORD_PATTERN, USERNAME_PATTERN, VALIDATION as V } from '@mbs/common';
import { GiftStatus, ReservationStatus } from '@mbs/contracts';
import { msg } from './messages';

// Caracteres de control (excepto salto de línea y tabulador).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = (v: string) => v.replace(CONTROL_CHARS, '').trim();

const required = () => z.string(msg('validation.required')).transform(clean).pipe(z.string().min(1, msg('validation.required')));
const text = (max: number) => required().pipe(z.string().max(max, msg('validation.maxlength', { max })));
const optionalText = (max: number) =>
  z
    .string()
    .transform(clean)
    .pipe(z.string().max(max, msg('validation.maxlength', { max })))
    .optional()
    .transform((v) => (v ? v : undefined));
const email = () =>
  z
    .string(msg('validation.required'))
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1, msg('validation.required')).max(V.EMAIL_MAX, msg('validation.maxlength', { max: V.EMAIL_MAX })).pipe(z.email(msg('validation.email'))));
const password = () =>
  z
    .string(msg('validation.required'))
    .min(V.PASSWORD_MIN, msg('validation.minlength', { min: V.PASSWORD_MIN }))
    .max(V.PASSWORD_MAX, msg('validation.maxlength', { max: V.PASSWORD_MAX }))
    .regex(PASSWORD_PATTERN, msg('validation.passwordPattern'));
const isoDate = () => z.iso.datetime({ offset: true, message: msg('validation.required') });
const quantity = (max: number = V.GIFT_QUANTITY_MAX) =>
  z.coerce
    .number(msg('validation.required'))
    .int(msg('validation.integer'))
    .min(1, msg('validation.min', { min: 1 }))
    .max(max, msg('validation.max', { max }));

const passwordsMatch = (d: { password: string; confirmPassword: string }) => d.password === d.confirmPassword;
const mismatch = { message: msg('validation.passwordMismatch'), path: ['confirmPassword'] };

// ---------------------------------------------------------------- Autenticación
const usernameField = () =>
  z
    .string(msg('validation.required'))
    .transform((v) => v.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(V.USERNAME_MIN, msg('validation.minlength', { min: V.USERNAME_MIN }))
        .max(V.USERNAME_MAX, msg('validation.maxlength', { max: V.USERNAME_MAX }))
        .regex(USERNAME_PATTERN, msg('validation.usernamePattern')),
    );

/** Fecha de <input type="datetime-local"> (formularios); se convierte a ISO antes de enviar. */
const localDate = () => z.string(msg('validation.required')).min(1, msg('validation.required'));

export const registerFormSchema = z
  .object({
    fatherName: text(V.PERSON_NAME_MAX),
    motherName: text(V.PERSON_NAME_MAX),
    babyName: text(V.BABY_NAME_MAX),
    eventDate: localDate(),
    description: optionalText(V.EVENT_DESCRIPTION_MAX),
    email: email(),
    username: usernameField(),
    password: password(),
    confirmPassword: z.string(msg('validation.required')).min(1, msg('validation.required')),
  })
  .refine(passwordsMatch, mismatch);

export const eventFormSchema = z.object({
  babyName: text(V.BABY_NAME_MAX),
  fatherName: text(V.PERSON_NAME_MAX),
  motherName: text(V.PERSON_NAME_MAX),
  eventDate: localDate(),
  description: z.string().transform(clean).pipe(z.string().max(V.EVENT_DESCRIPTION_MAX, msg('validation.maxlength', { max: V.EVENT_DESCRIPTION_MAX }))),
});


export const registerSchema = z
  .strictObject({
    fatherName: text(V.PERSON_NAME_MAX),
    motherName: text(V.PERSON_NAME_MAX),
    babyName: text(V.BABY_NAME_MAX),
    eventDate: isoDate(),
    description: optionalText(V.EVENT_DESCRIPTION_MAX),
    email: email(),
    username: usernameField(),
    password: password(),
    confirmPassword: z.string(msg('validation.required')).min(1, msg('validation.required')),
  })
  .refine(passwordsMatch, mismatch);
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.strictObject({
  identifier: z
    .string(msg('validation.required'))
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1, msg('validation.required')).max(V.EMAIL_MAX)),
  password: z.string(msg('validation.required')).min(1, msg('validation.required')).max(V.PASSWORD_MAX),
});



// ---------------------------------------------------------------- Baby Shower
export const updateBabyShowerSchema = z.strictObject({
  babyName: text(V.BABY_NAME_MAX).optional(),
  fatherName: text(V.PERSON_NAME_MAX).optional(),
  motherName: text(V.PERSON_NAME_MAX).optional(),
  eventDate: isoDate().optional(),
  description: z
    .union([z.null(), z.string().transform(clean).pipe(z.string().max(V.EVENT_DESCRIPTION_MAX, msg('validation.maxlength', { max: V.EVENT_DESCRIPTION_MAX })))])
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
});

// ---------------------------------------------------------------- Regalos
export const createGiftSchema = z.strictObject({
  name: text(V.GIFT_NAME_MAX),
  description: optionalText(V.GIFT_DESCRIPTION_MAX),
  categoryId: z.uuid(msg('validation.required')),
  quantityRequired: quantity(),
});

export const updateGiftSchema = z.strictObject({
  name: text(V.GIFT_NAME_MAX).optional(),
  description: z
    .string()
    .transform(clean)
    .pipe(z.string().max(V.GIFT_DESCRIPTION_MAX, msg('validation.maxlength', { max: V.GIFT_DESCRIPTION_MAX })))
    .optional(),
  categoryId: z.uuid().optional(),
  quantityRequired: quantity().optional(),
});

export const giftFiltersSchema = z.object({
  categoryId: z.uuid().optional(),
  status: z.enum(GiftStatus).optional(),
});

// ---------------------------------------------------------------- Reservas
export const createReservationSchema = z.strictObject({
  guestName: text(V.GUEST_NAME_MAX),
  quantity: quantity(),
  message: optionalText(V.GUEST_MESSAGE_MAX),
});

/** Formulario de reserva: el máximo depende de las unidades disponibles del regalo. */
export const reservationFormSchema = (available: number) =>
  z.object({
    guestName: text(V.GUEST_NAME_MAX),
      quantity: quantity(available),
    message: optionalText(V.GUEST_MESSAGE_MAX),
  });

export const giftFormSchema = z.object({
  name: text(V.GIFT_NAME_MAX),
  description: z.string().transform(clean).pipe(z.string().max(V.GIFT_DESCRIPTION_MAX, msg('validation.maxlength', { max: V.GIFT_DESCRIPTION_MAX }))),
  categoryId: z.string().min(1, msg('validation.required')),
  quantityRequired: quantity(),
});

export const reservationFiltersSchema = z.object({
  giftId: z.uuid().optional(),
  status: z.enum(ReservationStatus).optional(),
});

export const updateReservationStatusSchema = z.strictObject({
  status: z.enum(ReservationStatus),
});

/** Identificadores públicos (slug del enlace e ID opaco de regalo). */
export const SAFE_PUBLIC_ID = /^[A-Za-z0-9_-]{1,80}$/;
