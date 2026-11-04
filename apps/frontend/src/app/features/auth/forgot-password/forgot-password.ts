import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/api/auth-api';
import { errorKey } from '../../../core/http/api-error';
import { FieldError } from '../../../shared/components/field-error';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, FieldError],
  template: `
    <section class="auth-shell">
      <div class="auth-card">
        <h1>{{ 'auth.forgot.title' | translate }}</h1>
        <p class="subtitle">{{ 'auth.forgot.subtitle' | translate }}</p>

        @if (sent()) {
          <div class="alert alert-success" role="status">{{ 'auth.forgot.sent' | translate }}</div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (error(); as e) {
              <div class="alert alert-error" role="alert">{{ e | translate }}</div>
            }
            <div class="field">
              <label for="email">{{ 'auth.forgot.email' | translate }}</label>
              <input id="email" type="email" formControlName="email" autocomplete="email"
                [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid" aria-describedby="email-error" />
              <app-field-error [control]="form.controls.email" errorId="email-error" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="submitting()">
              {{ (submitting() ? 'common.loading' : 'auth.forgot.submit') | translate }}
            </button>
          </form>
        }
        <p class="auth-footer"><a routerLink="/login">{{ 'auth.forgot.backToLogin' | translate }}</a></p>
      </div>
    </section>
  `,
})
export class ForgotPasswordPage {
  private readonly api = inject(AuthApi);
  protected readonly sent = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.api.forgotPassword(this.form.getRawValue()));
      this.sent.set(true);
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
