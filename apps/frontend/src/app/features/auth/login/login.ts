import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { errorKey } from '../../../core/http/api-error';
import { FieldError } from '../../../shared/components/field-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, FieldError],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Ruta a la que volver tras iniciar sesión (query param). */
  readonly returnUrl = input<string>();

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    identifier: ['', [Validators.required, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(128)]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      const target = this.returnUrl();
      // Solo se permiten rutas internas para evitar redirecciones abiertas.
      await this.router.navigateByUrl(target?.startsWith('/') && !target.startsWith('//') ? target : '/dashboard');
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
