import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PASSWORD_PATTERN, VALIDATION } from '@mbs/common';
import { AuthApi } from '../../../core/api/auth-api';
import { errorKey } from '../../../core/http/api-error';
import { FieldError } from '../../../shared/components/field-error';
import { matchFields } from '../../../shared/validators/validators';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, FieldError],
  template: `
    <section class="auth-shell">
      <div class="auth-card">
        <h1>{{ 'auth.reset.title' | translate }}</h1>
        <p class="subtitle">{{ 'auth.reset.subtitle' | translate }}</p>

        @if (!token()) {
          <div class="alert alert-error" role="alert">{{ 'auth.reset.missingToken' | translate }}</div>
          <p class="auth-footer"><a routerLink="/forgot-password">{{ 'auth.forgot.submit' | translate }}</a></p>
        } @else if (done()) {
          <div class="alert alert-success" role="status">{{ 'auth.reset.success' | translate }}</div>
          <p class="auth-footer"><a class="btn btn-primary" routerLink="/login">{{ 'auth.reset.goToLogin' | translate }}</a></p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (error(); as e) {
              <div class="alert alert-error" role="alert">{{ e | translate }}</div>
            }
            <div class="field">
              <label for="password">{{ 'auth.reset.password' | translate }}</label>
              <input id="password" type="password" formControlName="password" autocomplete="new-password"
                [attr.aria-invalid]="form.controls.password.touched && form.controls.password.invalid" aria-describedby="password-hint password-error" />
              <p class="field-hint" id="password-hint">{{ 'auth.register.passwordHint' | translate }}</p>
              <app-field-error [control]="form.controls.password" errorId="password-error" patternKey="validation.passwordPattern" />
            </div>
            <div class="field">
              <label for="confirmPassword">{{ 'auth.reset.confirmPassword' | translate }}</label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword" autocomplete="new-password"
                [attr.aria-invalid]="form.controls.confirmPassword.touched && form.controls.confirmPassword.invalid" aria-describedby="confirm-error" />
              <app-field-error [control]="form.controls.confirmPassword" errorId="confirm-error" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="submitting()">
              {{ (submitting() ? 'common.saving' : 'auth.reset.submit') | translate }}
            </button>
          </form>
        }
      </div>
    </section>
  `,
})
export class ResetPasswordPage {
  private readonly api = inject(AuthApi);
  /** Token recibido por query param (?token=...). */
  readonly token = input<string>();
  protected readonly done = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      password: [
        '',
        [Validators.required, Validators.minLength(VALIDATION.PASSWORD_MIN), Validators.maxLength(VALIDATION.PASSWORD_MAX), Validators.pattern(PASSWORD_PATTERN)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchFields('password', 'confirmPassword') },
  );

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.api.resetPassword({ token: this.token() ?? '', ...this.form.getRawValue() }));
      this.done.set(true);
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
