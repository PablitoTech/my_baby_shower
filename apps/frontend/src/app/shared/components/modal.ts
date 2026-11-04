import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

let nextId = 0;

/** Modal accesible basado en <dialog>: atrapa el foco y se cierra con Escape. */
@Component({
  selector: 'app-modal',
  imports: [TranslatePipe],
  template: `
    <dialog #dialog class="modal" [attr.aria-labelledby]="titleId" (close)="closed.emit()" (click)="onBackdrop($event)">
      <div class="modal-card">
        <header>
          <h2 [id]="titleId">{{ heading() }}</h2>
          <button type="button" class="close" (click)="dialog.close()" [attr.aria-label]="'common.close' | translate">×</button>
        </header>
        <ng-content />
      </div>
    </dialog>
  `,
  styles: `
    .modal {
      width: min(560px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); padding: 0; border: 0;
      border-radius: var(--radius-lg); background: var(--c-surface); color: var(--c-ink); box-shadow: var(--shadow-lg);
    }
    .modal[open] { animation: pop .25s var(--ease); }
    .modal::backdrop { background: rgb(59 53 72 / 35%); backdrop-filter: blur(3px); }
    .modal-card { padding: 1.5rem; }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    h2 { font-size: 1.35rem; margin: 0; }
    .close {
      flex: none; width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--c-lavender);
      color: var(--c-ink); font-size: 1.5rem; line-height: 1; cursor: pointer;
    }
    @keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
