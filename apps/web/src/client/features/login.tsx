'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { loginSchema } from '@/shared/schemas';
import { errorKey } from '../api';
import { safeReturnUrl, useAuth } from '../auth';
import { Field, a11y } from '../ui/field';
import { useTitle } from '../use-title';
import { GuestOnly } from './guest-only';
import { PasswordInput } from './password-input';

type Form = z.input<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  useTitle('nav.login');
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { identifier: '', password: '' },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      router.push(safeReturnUrl(params.get('returnUrl')));
    } catch (err) {
      setError(errorKey(err));
    }
  });

  return (
    <GuestOnly>
      <section className="auth-shell">
        <div className="auth-card">
          <h1>{t('auth.login.title')}</h1>
          <p className="subtitle">{t('auth.login.subtitle')}</p>
          <form onSubmit={onSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{t(error)}</div>}
            <Field id="identifier" label={t('auth.login.identifier')} error={e.identifier}>
              <input {...a11y('identifier', e.identifier)} type="text" autoComplete="username" autoCapitalize="none" {...register('identifier')} />
            </Field>
            <Field id="password" label={t('auth.login.password')} error={e.password}>
              <PasswordInput {...a11y('password', e.password)} autoComplete="current-password" {...register('password')} />
            </Field>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={formState.isSubmitting}>
              {t(formState.isSubmitting ? 'common.loading' : 'auth.login.submit')}
            </button>
          </form>
          <p className="auth-footer">
            {t('auth.login.noAccount')} <Link href="/register">{t('auth.login.createAccount')}</Link>
          </p>
        </div>
      </section>
    </GuestOnly>
  );
}
