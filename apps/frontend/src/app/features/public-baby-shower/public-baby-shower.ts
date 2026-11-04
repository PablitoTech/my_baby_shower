import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { VALIDATION } from '@mbs/common';
import type { PublicBabyShower, PublicGift, ReservationConfirmation } from '@mbs/contracts';
import { BabyShowerApi } from '../../core/api/baby-shower-api';
import { errorCode, errorKey } from '../../core/http/api-error';
import { LanguageService } from '../../core/i18n/language.service';
import { FieldError } from '../../shared/components/field-error';
import { GiftCard } from '../../shared/components/gift-card';
import { Modal } from '../../shared/components/modal';
import { integer } from '../../shared/validators/validators';

@Component({
  selector: 'app-public-baby-shower',
  imports: [ReactiveFormsModule, TranslatePipe, DatePipe, GiftCard, Modal, FieldError],
  templateUrl: './public-baby-shower.html',
  styleUrl: './public-baby-shower.scss',
})
export class PublicBabyShowerPage {
  private readonly api = inject(BabyShowerApi);
  protected readonly language = inject(LanguageService);

  /** Identificador público tomado de la URL. */
  readonly slug = input.required<string>();

  protected readonly V = VALIDATION;
  protected readonly data = signal<PublicBabyShower | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly categoryFilter = signal('');

  /** Solo regalos con unidades disponibles (el backend ya excluye los agotados). */
  private readonly availableGifts = computed(() => (this.data()?.gifts ?? []).filter((g) => g.quantityAvailable > 0));
  protected readonly categories = computed(() => [...new Set(this.availableGifts().map((g) => g.categoryCode))]);
  protected readonly visibleGifts = computed(() =>
    this.availableGifts().filter((g) => !this.categoryFilter() || g.categoryCode === this.categoryFilter()),
  );

  // ---- Reserva ----
  protected readonly selected = signal<PublicGift | null>(null);
  protected readonly confirmation = signal<ReservationConfirmation | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly modalTitle = computed(() => {
    this.language.current();
    if (this.confirmation()) return this.language.instant('public.successTitle');
    const gift = this.selected();
    return gift ? this.language.instant('public.formTitle', { gift: gift.name }) : '';
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    guestName: ['', [Validators.required, Validators.maxLength(VALIDATION.GUEST_NAME_MAX)]],
    guestEmail: ['', [Validators.email, Validators.maxLength(VALIDATION.EMAIL_MAX)]],
    quantity: [1, [Validators.required, Validators.min(1), integer]],
    message: ['', [Validators.maxLength(VALIDATION.GUEST_MESSAGE_MAX)]],
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.load(slug));
    });
  }

  protected async load(slug = this.slug()): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await firstValueFrom(this.api.getPublic(slug)));
      this.notFound.set(false);
    } catch (err) {
      const code = errorCode(err);
      if (code === 'BABY_SHOWER_NOT_FOUND' || code === 'NOT_FOUND') this.notFound.set(true);
      else this.error.set(errorKey(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected openReserve(gift: PublicGift): void {
    this.selected.set(gift);
    this.confirmation.set(null);
    this.formError.set(null);
    this.form.reset({ guestName: this.form.controls.guestName.value, guestEmail: this.form.controls.guestEmail.value, quantity: 1, message: '' });
    this.form.controls.quantity.setValidators([Validators.required, Validators.min(1), Validators.max(gift.quantityAvailable), integer]);
    this.form.controls.quantity.updateValueAndValidity();
  }

  protected close(): void {
    this.selected.set(null);
    this.confirmation.set(null);
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  protected async reserve(): Promise<void> {
    const gift = this.selected();
    if (!gift) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.formError.set(null);
    const v = this.form.getRawValue();
    try {
      const result = await firstValueFrom(
        this.api.reserve(this.slug(), gift.publicId, {
          guestName: v.guestName,
          guestEmail: v.guestEmail.trim() || undefined,
          quantity: Number(v.quantity),
          message: v.message.trim() || undefined,
        }),
      );
      this.confirmation.set(result);
      void this.refreshQuietly();
    } catch (err) {
      this.formError.set(errorKey(err));
      if (errorCode(err) === 'RESERVATION_EXCEEDS_AVAILABLE') void this.refreshQuietly();
    } finally {
      this.submitting.set(false);
    }
  }

  /** Actualiza la disponibilidad tras reservar sin mostrar el estado de carga. */
  private async refreshQuietly(): Promise<void> {
    try {
      const fresh = await firstValueFrom(this.api.getPublic(this.slug()));
      this.data.set(fresh);
      // Si la categoría filtrada se quedó sin regalos, vuelve a "Todas".
      if (this.categoryFilter() && !this.categories().includes(this.categoryFilter())) this.categoryFilter.set('');
      const current = this.selected();
      if (current && !this.confirmation()) {
        this.selected.set(fresh.gifts.find((g) => g.publicId === current.publicId) ?? null);
      }
    } catch {
      /* se mantiene la información anterior */
    }
  }
}
