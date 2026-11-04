import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { GiftStatus, ReservationStatus } from '@mbs/contracts';

@Component({
  selector: 'app-status-badge',
  imports: [TranslatePipe],
  template: `<span [class]="'badge badge-' + status().toLowerCase()">{{ key() | translate }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<GiftStatus | ReservationStatus>();
  readonly type = input<'gift' | 'reservation'>('gift');
  protected readonly key = computed(() => `${this.type() === 'gift' ? 'giftStatus' : 'reservationStatus'}.${this.status()}`);
}
