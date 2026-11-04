'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { VALIDATION as V } from '@mbs/common';
import type { BabyShowerDto } from '@mbs/contracts';
import { eventFormSchema } from '@/shared/schemas';
import { api, errorKey } from '../api';
import { isoToLocal, localToIso } from '../dates';
import { Field, a11y } from '../ui/field';
import { useToast } from '../ui/toast';
import { useTitle } from '../use-title';

type Form = z.input<typeof eventFormSchema>;

export function EventPage() {
  const { t } = useTranslation();
  useTitle('nav.event');
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<Form, unknown, z.output<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    mode: 'onTouched',
    defaultValues: { babyName: '', fatherName: '', motherName: '', eventDate: '', description: '' },
  });
  const e = formState.errors;

  useEffect(() => {
    api<BabyShowerDto>('/baby-shower')
      .then((b) =>
        reset({ babyName: b.babyName, fatherName: b.fatherName, motherName: b.motherName, eventDate: isoToLocal(b.eventDate), description: b.description ?? '' }),
      )
      .catch((err) => setError(errorKey(err)))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await api('/baby-shower', { method: 'PATCH', body: { ...v, eventDate: localToIso(v.eventDate), description: v.description || null } });
      toast.success('event.saved');
    } catch (err) {
      setError(errorKey(err));
    }
  });

  return (
    <div className="p-event">
      <header className="page-header">
        <div>
          <h1>{t('event.title')}</h1>
          <p>{t('event.subtitle')}</p>
        </div>
      </header>
      <form className="card form-grid cols-2" onSubmit={onSubmit} noValidate>
        {error && <div className="alert alert-error span-2" role="alert">{t(error)}</div>}
        <Field id="babyName" className="span-2" label={t('auth.register.babyName')} error={e.babyName}>
          <input {...a11y('babyName', e.babyName)} maxLength={V.BABY_NAME_MAX} {...register('babyName')} />
        </Field>
        <Field id="fatherName" label={t('auth.register.fatherName')} error={e.fatherName}>
          <input {...a11y('fatherName', e.fatherName)} maxLength={V.PERSON_NAME_MAX} {...register('fatherName')} />
        </Field>
        <Field id="motherName" label={t('auth.register.motherName')} error={e.motherName}>
          <input {...a11y('motherName', e.motherName)} maxLength={V.PERSON_NAME_MAX} {...register('motherName')} />
        </Field>
        <Field id="eventDate" className="span-2" label={t('auth.register.eventDate')} error={e.eventDate}>
          <input {...a11y('eventDate', e.eventDate)} type="datetime-local" {...register('eventDate')} />
        </Field>
        <Field id="description" className="span-2" optional label={t('auth.register.description')} error={e.description}>
          <textarea {...a11y('description', e.description)} rows={4} maxLength={V.EVENT_DESCRIPTION_MAX} placeholder={t('auth.register.descriptionPlaceholder')} {...register('description')} />
        </Field>
        <div className="span-2">
          <button type="submit" className="btn btn-primary" disabled={formState.isSubmitting || loading}>
            {t(formState.isSubmitting ? 'common.saving' : 'common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
