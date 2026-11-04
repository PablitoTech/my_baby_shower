'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { resetPasswordFormSchema } from '@/shared/schemas';
import { api, errorKey } from '../api';
import { Field, a11y } from '../ui/field';
import { useTitle } from '../use-title';
import { PasswordInput } from './password-input';

type Form = z.input<typeof resetPasswordFormSchema>;

export function ResetPasswordPage() {
  const { t } = useTranslation();
  useTitle('auth.reset.title');
  const token = useSearchParams().get('token');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form, unknown, z.output<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token: token ?? '', ...values } });
      setDone(true);
    } catch (err) {
      setError(errorKey(err));
    }
  });

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <h1>{t('auth.reset.title')}</h1>
        <p className="subtitle">{t('auth.reset.subtitle')}</p>
        {!token ? (
          <>
            <div className="alert alert-error" role="alert">{t('auth.reset.missingToken')}</div>
            <p className="auth-footer"><Link href="/forgot-password">{t('auth.forgot.submit')}</Link></p>
          </>
        ) : done ? (
          <>
            <div className="alert alert-success" role="status">{t('auth.reset.success')}</div>
            <p className="auth-footer"><Link className="btn btn-primary" href="/login">{t('auth.reset.goToLogin')}</Link></p>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{t(error)}</div>}
            <Field id="password" label={t('auth.reset.password')} hint={t('auth.register.passwordHint')} error={e.password}>
              <PasswordInput {...a11y('password', e.password, true)} autoComplete="new-password" {...register('password')} />
            </Field>
            <Field id="confirmPassword" label={t('auth.reset.confirmPassword')} error={e.confirmPassword}>
              <PasswordInput {...a11y('confirmPassword', e.confirmPassword)} autoComplete="new-password" {...register('confirmPassword')} />
            </Field>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={formState.isSubmitting}>
              {t(formState.isSubmitting ? 'common.saving' : 'auth.reset.submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
