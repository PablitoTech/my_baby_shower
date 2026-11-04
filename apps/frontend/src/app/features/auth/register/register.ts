import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PASSWORD_PATTERN, USERNAME_PATTERN, VALIDATION } from '@mbs/common';
import { AuthService } from '../../../core/auth/auth.service';
import { errorKey } from '../../../core/http/api-error';
import { FieldError } from '../../../shared/components/field-error';
import { localToIso, matchFields } from '../../../shared/validators/validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, FieldError],
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly V = VALIDATION;
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      fatherName: ['', [Validators.required, Validators.maxLength(VALIDATION.PERSON_NAME_MAX)]],
      motherName: ['', [Validators.required, Validators.maxLength(VALIDATION.PERSON_NAME_MAX)]],
      babyName: ['', [Validators.required, Validators.maxLength(VALIDATION.BABY_NAME_MAX)]],
      eventDate: ['', [Validators.required]],
      description: ['', [Validators.maxLength(VALIDATION.EVENT_DESCRIPTION_MAX)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(VALIDATION.EMAIL_MAX)]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(VALIDATION.USERNAME_MIN),
          Validators.maxLength(VALIDATION.USERNAME_MAX),
          Validators.pattern(USERNAME_PATTERN),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(VALIDATION.PASSWORD_MIN),
          Validators.maxLength(VALIDATION.PASSWORD_MAX),
          Validators.pattern(PASSWORD_PATTERN),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchFields('password', 'confirmPassword') },
  );

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    try {
      await this.auth.register({
        ...value,
        description: value.description.trim() || undefined,
        eventDate: localToIso(value.eventDate),
      });
      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
