import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-toast-host',
  imports: [TranslatePipe],
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.kind" role="status">
          <span>{{ toast.key | translate: toast.params }}</span>
          <button type="button" (click)="toasts.dismiss(toast.id)" [attr.aria-label]="'common.close' | translate">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed; z-index: 1000; inset: auto 16px 16px 16px; display: flex; flex-direction: column;
      align-items: center; gap: .5rem; pointer-events: none;
    }
    @media (min-width: 640px) { .toasts { inset: auto 24px 24px auto; align-items: flex-end; } }
    .toast {
      pointer-events: auto; display: flex; align-items: center; gap: .75rem; max-width: 420px; padding: .8rem 1rem;
      border-radius: var(--radius); background: #fff; box-shadow: var(--shadow-lg); font-weight: 600;
      animation: fade-up .3s var(--ease) both; border-left: 5px solid var(--c-lavender-deep);
    }
    .toast-success { border-left-color: var(--c-mint-deep); }
    .toast-error { border-left-color: var(--c-danger); }
    button { border: 0; background: transparent; font-size: 1.25rem; cursor: pointer; color: var(--c-ink-soft); }
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
}
