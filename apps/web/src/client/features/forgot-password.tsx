'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { forgotPasswordSchema } from '@/shared/schemas';
import { api, errorKey } from '../api';
import { Field, a11y } from '../ui/field';
import { useTitle } from '../use-title';

type Form = z.input<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  useTitle('auth.forgot.title');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form, unknown, z.output<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: values });
      setSent(true);
    } catch (err) {
      setError(errorKey(err));
    }
  });

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <h1>{t('auth.forgot.title')}</h1>
        <p className="subtitle">{t('auth.forgot.subtitle')}</p>
        {sent ? (
          <div className="alert alert-success" role="status">{t('auth.forgot.sent')}</div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{t(error)}</div>}
            <Field id="email" label={t('auth.forgot.email')} error={formState.errors.email}>
              <input {...a11y('email', formState.errors.email)} type="email" autoComplete="email" {...register('email')} />
            </Field>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={formState.isSubmitting}>
              {t(formState.isSubmitting ? 'common.loading' : 'auth.forgot.submit')}
            </button>
          </form>
        )}
        <p className="auth-footer"><Link href="/login">{t('auth.forgot.backToLogin')}</Link></p>
      </div>
    </section>
  );
}
