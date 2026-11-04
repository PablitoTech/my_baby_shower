import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { IMAGE_UPLOAD, VALIDATION } from '@mbs/common';
import { GiftStatus, type CategoryDto, type GiftDto } from '@mbs/contracts';
import { GiftsApi } from '../../core/api/gifts-api';
import { errorKey } from '../../core/http/api-error';
import { LanguageService } from '../../core/i18n/language.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';
import { FieldError } from '../../shared/components/field-error';
import { GiftCard } from '../../shared/components/gift-card';
import { Modal } from '../../shared/components/modal';
import { integer } from '../../shared/validators/validators';

interface CategoryGroup {
  category: CategoryDto;
  gifts: GiftDto[];
}

@Component({
  selector: 'app-gifts',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, GiftCard, Modal, FieldError],
  templateUrl: './gifts.html',
  styleUrl: './gifts.scss',
})
export class GiftsPage {
  private readonly api = inject(GiftsApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly language = inject(LanguageService);

  protected readonly V = VALIDATION;
  protected readonly statuses = Object.values(GiftStatus);
  protected readonly acceptedImages = IMAGE_UPLOAD.MIME_TYPES.join(',');

  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly gifts = signal<GiftDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filterCategory = signal('');
  protected readonly filterStatus = signal('');

  /** Regalos filtrados y agrupados por categoría. */
  protected readonly groups = computed<CategoryGroup[]>(() => {
    const cat = this.filterCategory();
    const status = this.filterStatus();
    const filtered = this.gifts().filter((g) => (!cat || g.category.id === cat) && (!status || g.status === status));
    return this.categories()
      .map((category) => ({ category, gifts: filtered.filter((g) => g.category.id === category.id) }))
      .filter((group) => group.gifts.length > 0);
  });

  // ---- Formulario (crear / editar) ----
  protected readonly editing = signal<GiftDto | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly imageFile = signal<File | null>(null);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly modalTitle = computed(() => {
    this.language.current();
    return this.language.instant(this.editing() ? 'gifts.editTitle' : 'gifts.createTitle');
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(VALIDATION.GIFT_NAME_MAX)]],
    description: ['', [Validators.maxLength(VALIDATION.GIFT_DESCRIPTION_MAX)]],
    categoryId: ['', [Validators.required]],
    quantityRequired: [1, [Validators.required, Validators.min(VALIDATION.GIFT_QUANTITY_MIN), Validators.max(VALIDATION.GIFT_QUANTITY_MAX), integer]],
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [categories, gifts] = await Promise.all([firstValueFrom(this.api.categories()), firstValueFrom(this.api.list())]);
      this.categories.set(categories);
      this.gifts.set(gifts);
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', description: '', categoryId: this.filterCategory() || '', quantityRequired: 1 });
    this.resetImage(null);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(gift: GiftDto): void {
    this.editing.set(gift);
    this.form.reset({
      name: gift.name,
      description: gift.description ?? '',
      categoryId: gift.category.id,
      quantityRequired: gift.quantityRequired,
    });
    this.resetImage(gift.imageUrl);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  protected onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    if (!(IMAGE_UPLOAD.MIME_TYPES as readonly string[]).includes(file.type) || file.size > IMAGE_UPLOAD.MAX_BYTES) {
      this.formError.set('errors.INVALID_IMAGE');
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.formError.set(null);
    this.revokePreview();
    this.imageFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }

  protected async removeImage(): Promise<void> {
    const gift = this.editing();
    if (gift?.imageUrl && !this.imageFile()) {
      try {
        const updated = await firstValueFrom(this.api.removeImage(gift.id));
        this.replace(updated);
        this.editing.set(updated);
      } catch (err) {
        this.formError.set(errorKey(err));
        return;
      }
    }
    this.resetImage(null);
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    const value = this.form.getRawValue();
    const body = { ...value, quantityRequired: Number(value.quantityRequired), description: value.description.trim() };
    try {
      const current = this.editing();
      let gift = current
        ? await firstValueFrom(this.api.update(current.id, body))
        : await firstValueFrom(this.api.create({ ...body, description: body.description || undefined }));
      const file = this.imageFile();
      if (file) gift = await firstValueFrom(this.api.uploadImage(gift.id, file));

      if (current) this.replace(gift);
      else this.gifts.update((list) => [...list, gift]);
      this.toast.success('gifts.saved');
      this.formOpen.set(false);
    } catch (err) {
      this.formError.set(errorKey(err));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(gift: GiftDto): Promise<void> {
    const ok = await this.confirm.ask('gifts.deleteConfirm', { params: { name: gift.name }, confirmKey: 'common.delete', danger: true });
    if (!ok) return;
    try {
      await firstValueFrom(this.api.remove(gift.id));
      this.gifts.update((list) => list.filter((g) => g.id !== gift.id));
      this.toast.success('gifts.deleted');
    } catch (err) {
      this.toast.error(errorKey(err));
    }
  }

  protected onClosed(): void {
    this.formOpen.set(false);
    this.revokePreview();
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  private replace(gift: GiftDto): void {
    this.gifts.update((list) => list.map((g) => (g.id === gift.id ? gift : g)));
  }

  private resetImage(url: string | null): void {
    this.revokePreview();
    this.imageFile.set(null);
    this.imagePreview.set(url);
  }

  private revokePreview(): void {
    const preview = this.imagePreview();
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }
}
