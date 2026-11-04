import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ReservationStatus, type GiftDto, type ReservationDto } from '@mbs/contracts';
import { allowedReservationTransitions } from '@mbs/shared';
import { GiftsApi } from '../../core/api/gifts-api';
import { ReservationsApi } from '../../core/api/reservations-api';
import { errorKey } from '../../core/http/api-error';
import { LanguageService } from '../../core/i18n/language.service';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';
import { StatusBadge } from '../../shared/components/status-badge';

const ACTION_KEYS: Partial<Record<ReservationStatus, { key: string; css: string }>> = {
  CONFIRMED: { key: 'reservations.confirm', css: 'btn-secondary' },
  DELIVERED: { key: 'reservations.deliver', css: 'btn-primary' },
  CANCELLED: { key: 'reservations.cancel', css: 'btn-danger' },
};

@Component({
  selector: 'app-reservations',
  imports: [TranslatePipe, DatePipe, StatusBadge],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
})
export class ReservationsPage {
  private readonly api = inject(ReservationsApi);
  private readonly giftsApi = inject(GiftsApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  protected readonly language = inject(LanguageService);

  /** Filtros sincronizados con la URL (?giftId=&status=). */
  readonly giftId = input<string>();
  readonly status = input<ReservationStatus>();

  protected readonly statuses = Object.values(ReservationStatus);
  protected readonly gifts = signal<GiftDto[]>([]);
  protected readonly reservations = signal<ReservationDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);

  constructor() {
    void firstValueFrom(this.giftsApi.list())
      .then((g) => this.gifts.set(g))
      .catch(() => undefined);
    effect(() => {
      const filters = { giftId: this.giftId(), status: this.status() };
      untracked(() => void this.load(filters));
    });
  }

  protected actions(r: ReservationDto) {
    return allowedReservationTransitions(r.status).map((to) => ({ to, ...ACTION_KEYS[to]! }));
  }

  protected setFilter(name: 'giftId' | 'status', value: string): void {
    void this.router.navigate([], { queryParams: { [name]: value || null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected async load(filters: { giftId?: string; status?: ReservationStatus } = {}): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.reservations.set(await firstValueFrom(this.api.list(filters)));
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async change(r: ReservationDto, to: ReservationStatus): Promise<void> {
    if (to === 'CANCELLED') {
      const ok = await this.confirm.ask('reservations.cancelConfirm', { params: { guest: r.guestName }, confirmKey: 'reservations.cancel', danger: true });
      if (!ok) return;
    }
    this.busyId.set(r.id);
    try {
      const updated = await firstValueFrom(this.api.updateStatus(r.id, to));
      const statusFilter = this.status();
      this.reservations.update((list) =>
        statusFilter && updated.status !== statusFilter ? list.filter((x) => x.id !== r.id) : list.map((x) => (x.id === r.id ? updated : x)),
      );
      this.toast.success('reservations.updated');
    } catch (err) {
      this.toast.error(errorKey(err));
    } finally {
      this.busyId.set(null);
    }
  }
}
