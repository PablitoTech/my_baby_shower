import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import type { DashboardSummary } from '@mbs/contracts';
import { BabyShowerApi } from '../../core/api/baby-shower-api';
import { errorKey } from '../../core/http/api-error';
import { LanguageService } from '../../core/i18n/language.service';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TranslatePipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly api = inject(BabyShowerApi);
  private readonly toast = inject(ToastService);
  private readonly origin = inject(DOCUMENT).location.origin;
  protected readonly language = inject(LanguageService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly publicUrl = computed(() => {
    const slug = this.summary()?.babyShower.publicSlug;
    return slug ? `${this.origin}/baby-shower/${slug}` : null;
  });

  protected readonly countdown = computed(() => {
    const date = this.summary()?.babyShower.eventDate;
    if (!date) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const event = new Date(date);
    event.setHours(0, 0, 0, 0);
    const days = Math.round((event.getTime() - start.getTime()) / 86_400_000);
    if (days > 0) return { key: 'dashboard.daysLeft', params: { days } };
    return { key: days === 0 ? 'dashboard.today' : 'dashboard.past', params: {} };
  });

  protected readonly progress = computed(() => {
    const g = this.summary()?.gifts;
    return g && g.unitsRequired > 0 ? Math.round((g.unitsReserved / g.unitsRequired) * 100) : 0;
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.error.set(null);
    try {
      this.summary.set(await firstValueFrom(this.api.dashboard()));
    } catch (err) {
      this.error.set(errorKey(err));
    }
  }

  protected async togglePublish(publish: boolean): Promise<void> {
    this.busy.set(true);
    try {
      const babyShower = await firstValueFrom(publish ? this.api.publish() : this.api.unpublish());
      this.summary.update((s) => (s ? { ...s, babyShower } : s));
      this.toast.success(publish ? 'dashboard.publishedToast' : 'dashboard.unpublishedToast');
    } catch (err) {
      this.toast.error(errorKey(err));
    } finally {
      this.busy.set(false);
    }
  }

  protected async copyLink(): Promise<void> {
    const url = this.publicUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.toast.success('dashboard.linkCopied');
    } catch {
      this.toast.info(url);
    }
  }
}
