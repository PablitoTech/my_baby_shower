import { Component, computed, effect, input, signal } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

interface ErrorMessage {
  key: string;
  params?: Record<string, unknown>;
}

function toMessage(errors: ValidationErrors, patternKey: string): ErrorMessage {
  if (errors['required']) return { key: 'validation.required' };
  if (errors['email']) return { key: 'validation.email' };
  if (errors['minlength']) return { key: 'validation.minlength', params: { min: errors['minlength'].requiredLength } };
  if (errors['maxlength']) return { key: 'validation.maxlength', params: { max: errors['maxlength'].requiredLength } };
  if (errors['min']) return { key: 'validation.min', params: { min: errors['min'].min } };
  if (errors['max']) return { key: 'validation.max', params: { max: errors['max'].max } };
  if (errors['pattern']) return { key: patternKey };
  if (errors['passwordMismatch']) return { key: 'validation.passwordMismatch' };
  if (errors['integer']) return { key: 'validation.integer' };
  return { key: 'validation.pattern' };
}

/** Muestra el primer error traducido de un control cuando ya fue tocado. */
@Component({
  selector: 'app-field-error',
  imports: [TranslatePipe],
  template: `
    @if (message(); as m) {
      <p class="field-error" [id]="errorId()">{{ m.key | translate: m.params }}</p>
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  readonly errorId = input<string>();
  readonly patternKey = input('validation.pattern');

  private readonly version = signal(0);

  constructor() {
    effect((onCleanup) => {
      const sub = this.control().events.subscribe(() => this.version.update((v) => v + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected readonly message = computed<ErrorMessage | null>(() => {
    this.version();
    const control = this.control();
    if (!control.touched || !control.errors) return null;
    return toMessage(control.errors, this.patternKey());
  });
}
