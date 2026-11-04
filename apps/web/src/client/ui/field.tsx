'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { decodeMessage } from '@/shared/messages';

/** Cualquier error de react-hook-form (simple o anidado) con su mensaje. */
type RhfFieldError = { message?: string } | undefined;

/** Muestra el error traducido de un campo (los mensajes de zod son claves i18n). */
export function FieldError({ error, id }: { error?: RhfFieldError; id: string }) {
  const { t } = useTranslation();
  if (!error?.message) return null;
  const { key, params } = decodeMessage(error.message);
  return (
    <p className="field-error" id={id}>
      {t(key, params)}
    </p>
  );
}

interface FieldProps {
  id: string;
  label: ReactNode;
  error?: RhfFieldError;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/** Envoltorio de campo: etiqueta, pista y error enlazados por aria-describedby. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  const { t } = useTranslation();
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>
        {label} {optional && <span className="optional">{t('common.optional')}</span>}
      </label>
      {children}
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <FieldError error={error} id={`${id}-error`} />
    </div>
  );
}

/** Atributos de accesibilidad para un input con error. */
export function a11y(id: string, error?: RhfFieldError, hint = false) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hint ? `${id}-hint` : null, `${id}-error`].filter(Boolean).join(' '),
  } as const;
}
