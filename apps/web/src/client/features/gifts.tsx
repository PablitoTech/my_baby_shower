'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { IMAGE_UPLOAD, VALIDATION as V } from '@mbs/common';
import { GiftStatus, type CategoryDto, type GiftDto } from '@mbs/contracts';
import { giftFormSchema } from '@/shared/schemas';
import { api, errorKey } from '../api';
import { useConfirm } from '../ui/confirm';
import { Field, a11y } from '../ui/field';
import { GiftCard } from '../ui/gift-card';
import { Modal } from '../ui/modal';
import { useToast } from '../ui/toast';
import { useTitle } from '../use-title';
import { useLoad } from './use-load';

type Form = z.input<typeof giftFormSchema>;
const STATUSES = Object.values(GiftStatus);
const ACCEPTED = IMAGE_UPLOAD.MIME_TYPES.join(',');

/* eslint-disable @next/next/no-img-element */
export function GiftsPage() {
  const { t } = useTranslation();
  useTitle('nav.gifts');
  const toast = useToast();
  const confirm = useConfirm();

  const { data, setData, loading, error, reload } = useLoad(async () => {
    const [categories, gifts] = await Promise.all([api<CategoryDto[]>('/categories'), api<GiftDto[]>('/gifts')]);
    return { categories, gifts };
  });
  const categories = data?.categories ?? [];
  const gifts = data?.gifts ?? [];
  const setGifts = (fn: (list: GiftDto[]) => GiftDto[]) => setData((d) => (d ? { ...d, gifts: fn(d.gifts) } : d));

  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  /** Regalos filtrados y agrupados por categoría. */
  const groups = useMemo(() => {
    const filtered = gifts.filter((g) => (!filterCategory || g.category.id === filterCategory) && (!filterStatus || g.status === filterStatus));
    return categories.map((category) => ({ category, gifts: filtered.filter((g) => g.category.id === category.id) })).filter((x) => x.gifts.length);
  }, [gifts, categories, filterCategory, filterStatus]);

  // ---- Formulario (crear / editar) ----
  const [editing, setEditing] = useState<GiftDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<Form, unknown, z.output<typeof giftFormSchema>>({
    resolver: zodResolver(giftFormSchema),
    mode: 'onTouched',
    defaultValues: { name: '', description: '', categoryId: '', quantityRequired: 1 },
  });
  const e = formState.errors;

  // Libera las URL temporales de vista previa.
  useEffect(() => () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function openCreate() {
    setEditing(null);
    reset({ name: '', description: '', categoryId: filterCategory, quantityRequired: 1 });
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(gift: GiftDto) {
    setEditing(gift);
    reset({ name: gift.name, description: gift.description ?? '', categoryId: gift.category.id, quantityRequired: gift.quantityRequired });
    setImageFile(null);
    setImagePreview(gift.imageUrl);
    setFormError(null);
    setFormOpen(true);
  }

  function onImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(IMAGE_UPLOAD.MIME_TYPES as readonly string[]).includes(file.type) || file.size > IMAGE_UPLOAD.MAX_BYTES) {
      setFormError('errors.INVALID_IMAGE');
      event.target.value = '';
      return;
    }
    setFormError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function removeImage() {
    if (editing?.imageUrl && !imageFile) {
      try {
        const updated = await api<GiftDto>(`/gifts/${editing.id}/image`, { method: 'DELETE' });
        setGifts((list) => list.map((g) => (g.id === updated.id ? updated : g)));
        setEditing(updated);
      } catch (err) {
        setFormError(errorKey(err));
        return;
      }
    }
    setImageFile(null);
    setImagePreview(null);
  }

  const save = handleSubmit(async (values) => {
    setFormError(null);
    try {
      let gift = editing
        ? await api<GiftDto>(`/gifts/${editing.id}`, { method: 'PATCH', body: values })
        : await api<GiftDto>('/gifts', { method: 'POST', body: { ...values, description: values.description || undefined } });
      if (imageFile) {
        const form = new FormData();
        form.append('image', imageFile);
        gift = await api<GiftDto>(`/gifts/${gift.id}/image`, { method: 'POST', body: form });
      }
      setGifts((list) => (editing ? list.map((g) => (g.id === gift.id ? gift : g)) : [...list, gift]));
      toast.success('gifts.saved');
      setFormOpen(false);
    } catch (err) {
      setFormError(errorKey(err));
    }
  });

  async function remove(gift: GiftDto) {
    const ok = await confirm('gifts.deleteConfirm', { params: { name: gift.name }, confirmKey: 'common.delete', danger: true });
    if (!ok) return;
    try {
      await api(`/gifts/${gift.id}`, { method: 'DELETE' });
      setGifts((list) => list.filter((g) => g.id !== gift.id));
      toast.success('gifts.deleted');
    } catch (err) {
      toast.error(errorKey(err));
    }
  }

  return (
    <div className="p-gifts">
      <header className="page-header">
        <div>
          <h1>{t('gifts.title')}</h1>
          <p>{t('gifts.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>＋ {t('gifts.add')}</button>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {t(error)} <button type="button" className="btn btn-sm btn-secondary" onClick={() => void reload()}>{t('common.retry')}</button>
        </div>
      )}

      {gifts.length > 0 && (
        <div className="filters card">
          <div className="field">
            <label htmlFor="filter-category">{t('gifts.filterCategory')}</label>
            <select id="filter-category" value={filterCategory} onChange={(ev) => setFilterCategory(ev.target.value)}>
              <option value="">{t('gifts.allCategories')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.code}`)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-status">{t('gifts.filterStatus')}</label>
            <select id="filter-status" value={filterStatus} onChange={(ev) => setFilterStatus(ev.target.value)}>
              <option value="">{t('gifts.allStatuses')}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{t(`giftStatus.${s}`)}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <p role="status">{t('common.loading')}</p>
      ) : gifts.length === 0 && !error ? (
        <div className="empty-state card">
          <img src="/images/empty.svg" alt="" width={160} height={128} />
          <p>{t('gifts.empty')}</p>
          <button type="button" className="btn btn-primary" onClick={openCreate}>{t('gifts.emptyCta')}</button>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state card"><p>{t('gifts.emptyFiltered')}</p></div>
      ) : (
        groups.map((group) => (
          <section key={group.category.id} className="group" aria-labelledby={`cat-${group.category.code}`}>
            <h2 id={`cat-${group.category.code}`}>
              {t(`categories.${group.category.code}`)} <span className="count">{group.gifts.length}</span>
            </h2>
            <div className="gift-grid">
              {group.gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  name={gift.name}
                  description={gift.description}
                  categoryCode={gift.category.code}
                  imageUrl={gift.imageUrl}
                  status={gift.status}
                  available={gift.quantityAvailable}
                  required={gift.quantityRequired}
                >
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(gift)}>✏️ {t('common.edit')}</button>
                  {gift.quantityReserved > 0 && (
                    <Link className="btn btn-ghost btn-sm" href={`/reservations?giftId=${gift.id}`}>{t('gifts.viewReservations')}</Link>
                  )}
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => void remove(gift)} aria-label={`${t('common.delete')} ${gift.name}`}>🗑️</button>
                </GiftCard>
              ))}
            </div>
          </section>
        ))
      )}

      <Modal open={formOpen} heading={t(editing ? 'gifts.editTitle' : 'gifts.createTitle')} onClose={() => setFormOpen(false)}>
        <form className="form-grid cols-2" onSubmit={save} noValidate>
          {formError && <div className="alert alert-error span-2" role="alert">{t(formError)}</div>}
          <Field id="gift-name" className="span-2" label={t('gifts.name')} error={e.name}>
            <input {...a11y('gift-name', e.name)} maxLength={V.GIFT_NAME_MAX} placeholder={t('gifts.namePlaceholder')} {...register('name')} />
          </Field>
          <Field id="gift-description" className="span-2" optional label={t('gifts.description')} error={e.description}>
            <textarea {...a11y('gift-description', e.description)} rows={2} maxLength={V.GIFT_DESCRIPTION_MAX} placeholder={t('gifts.descriptionPlaceholder')} {...register('description')} />
          </Field>
          <Field id="gift-category" label={t('gifts.category')} error={e.categoryId}>
            <select {...a11y('gift-category', e.categoryId)} {...register('categoryId')}>
              <option value="" disabled>{t('gifts.selectCategory')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.code}`)}</option>)}
            </select>
          </Field>
          <Field id="gift-quantity" label={t('gifts.quantity')} error={e.quantityRequired}>
            <input {...a11y('gift-quantity', e.quantityRequired)} type="number" inputMode="numeric" min={V.GIFT_QUANTITY_MIN} max={V.GIFT_QUANTITY_MAX} {...register('quantityRequired', { valueAsNumber: true })} />
          </Field>
          <div className="field span-2">
            <span className="label">{t('gifts.image')} <span className="optional">{t('common.optional')}</span></span>
            <div className="image-picker">
              {imagePreview && <img src={imagePreview} alt="" />}
              <div className="image-actions">
                <label className="btn btn-secondary btn-sm" htmlFor="gift-image">📷 {t(imagePreview ? 'gifts.changeImage' : 'gifts.image')}</label>
                <input id="gift-image" className="sr-only" type="file" accept={ACCEPTED} onChange={onImageSelected} />
                {imagePreview && <button type="button" className="btn btn-ghost btn-sm" onClick={() => void removeImage()}>{t('gifts.removeImage')}</button>}
                <p className="field-hint">{t('gifts.imageHint')}</p>
              </div>
            </div>
          </div>
          <div className="span-2 modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={formState.isSubmitting}>{t(formState.isSubmitting ? 'common.saving' : 'common.save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
