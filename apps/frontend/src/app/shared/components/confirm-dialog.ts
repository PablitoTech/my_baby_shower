import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmService } from '../../core/ui/confirm.service';
import { Modal } from './modal';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal, TranslatePipe],
  template: `
    <app-modal [open]="!!confirm.request()" [heading]="title()" (closed)="confirm.answer(false)">
      @if (confirm.request(); as req) {
        <p>{{ req.messageKey | translate: req.params }}</p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="confirm.answer(false)">{{ 'common.cancel' | translate }}</button>
          <button type="button" class="btn" [class.btn-danger]="req.danger" [class.btn-primary]="!req.danger" (click)="confirm.answer(true)">
            {{ (req.confirmKey ?? 'common.confirm') | translate }}
          </button>
        </div>
      }
    </app-modal>
  `,
  styles: `.actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: .5rem; margin-top: 1.25rem; }`,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly language = inject(LanguageService);
  protected readonly title = computed(() => {
    this.language.current();
    return this.language.instant('common.confirm');
  });
}
