'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { VALIDATION as V } from '@mbs/common';
import { registerFormSchema } from '@/shared/schemas';
import { errorKey } from '../api';
import { useAuth } from '../auth';
import { localToIso } from '../dates';
import { Field, a11y } from '../ui/field';
import { useTitle } from '../use-title';
import { GuestOnly } from './guest-only';
import { PasswordInput } from './password-input';

type Form = z.input<typeof registerFormSchema>;

export function RegisterPage() {
  const { t } = useTranslation();
  useTitle('nav.register');
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form, unknown, z.output<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onTouched',
    defaultValues: {
      fatherName: '', motherName: '', babyName: '', eventDate: '', description: '',
      email: '', username: '', password: '', confirmPassword: '',
    },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await auth.register({ ...values, eventDate: localToIso(values.eventDate) });
      router.push('/dashboard');
    } catch (err) {
      setError(errorKey(err));
    }
  });

  return (
    <GuestOnly>
      <section className="auth-shell">
        <div className="auth-card wide">
          <h1>{t('auth.register.title')}</h1>
          <p className="subtitle">{t('auth.register.subtitle')}</p>
          <form onSubmit={onSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{t(error)}</div>}

            <fieldset>
              <legend>{t('auth.register.sectionEvent')}</legend>
              <div className="form-grid cols-2">
                <Field id="babyName" className="span-2" label={t('auth.register.babyName')} hint={t('auth.register.babyNameHint')} error={e.babyName}>
                  <input {...a11y('babyName', e.babyName, true)} autoComplete="off" maxLength={V.BABY_NAME_MAX} {...register('babyName')} />
                </Field>
                <Field id="fatherName" label={t('auth.register.fatherName')} error={e.fatherName}>
                  <input {...a11y('fatherName', e.fatherName)} autoComplete="name" maxLength={V.PERSON_NAME_MAX} {...register('fatherName')} />
                </Field>
                <Field id="motherName" label={t('auth.register.motherName')} error={e.motherName}>
                  <input {...a11y('motherName', e.motherName)} autoComplete="name" maxLength={V.PERSON_NAME_MAX} {...register('motherName')} />
                </Field>
                <Field id="eventDate" className="span-2" label={t('auth.register.eventDate')} error={e.eventDate}>
                  <input {...a11y('eventDate', e.eventDate)} type="datetime-local" {...register('eventDate')} />
                </Field>
                <Field id="description" className="span-2" optional label={t('auth.register.description')} error={e.description}>
                  <textarea {...a11y('description', e.description)} rows={3} maxLength={V.EVENT_DESCRIPTION_MAX} placeholder={t('auth.register.descriptionPlaceholder')} {...register('description')} />
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend>{t('auth.register.sectionAccount')}</legend>
              <div className="form-grid cols-2">
                <Field id="email" label={t('auth.register.email')} error={e.email}>
                  <input {...a11y('email', e.email)} type="email" autoComplete="email" {...register('email')} />
                </Field>
                <Field id="username" label={t('auth.register.username')} hint={t('auth.register.usernameHint')} error={e.username}>
                  <input {...a11y('username', e.username, true)} autoComplete="username" autoCapitalize="none" {...register('username')} />
                </Field>
                <Field id="password" label={t('auth.register.password')} hint={t('auth.register.passwordHint')} error={e.password}>
                  <PasswordInput {...a11y('password', e.password, true)} autoComplete="new-password" {...register('password')} />
                </Field>
                <Field id="confirmPassword" label={t('auth.register.confirmPassword')} error={e.confirmPassword}>
                  <PasswordInput {...a11y('confirmPassword', e.confirmPassword)} autoComplete="new-password" {...register('confirmPassword')} />
                </Field>
              </div>
            </fieldset>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={formState.isSubmitting}>
              {t(formState.isSubmitting ? 'common.loading' : 'auth.register.submit')}
            </button>
          </form>
          <p className="auth-footer">
            {t('auth.register.haveAccount')} <Link href="/login">{t('auth.register.login')}</Link>
          </p>
        </div>
      </section>
    </GuestOnly>
  );
}
