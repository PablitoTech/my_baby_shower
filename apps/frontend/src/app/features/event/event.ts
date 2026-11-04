import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { VALIDATION } from '@mbs/common';
import { BabyShowerApi } from '../../core/api/baby-shower-api';
import { errorKey } from '../../core/http/api-error';
import { ToastService } from '../../core/ui/toast.service';
import { FieldError } from '../../shared/components/field-error';
import { isoToLocal, localToIso } from '../../shared/validators/validators';

@Component({
  selector: 'app-event',
  imports: [ReactiveFormsModule, TranslatePipe, FieldError],
  template: `
    <header class="page-header">
      <div>
        <h1>{{ 'event.title' | translate }}</h1>
        <p>{{ 'event.subtitle' | translate }}</p>
      </div>
    </header>

    <form class="card form-grid cols-2" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      @if (error(); as e) {
        <div class="alert alert-error span-2" role="alert">{{ e | translate }}</div>
      }
      <div class="field span-2">
        <label for="babyName">{{ 'auth.register.babyName' | translate }}</label>
        <input id="babyName" formControlName="babyName" [attr.maxlength]="V.BABY_NAME_MAX" aria-describedby="babyName-error"
          [attr.aria-invalid]="form.controls.babyName.touched && form.controls.babyName.invalid" />
        <app-field-error [control]="form.controls.babyName" errorId="babyName-error" />
      </div>
      <div class="field">
        <label for="fatherName">{{ 'auth.register.fatherName' | translate }}</label>
        <input id="fatherName" formControlName="fatherName" [attr.maxlength]="V.PERSON_NAME_MAX" aria-describedby="fatherName-error"
          [attr.aria-invalid]="form.controls.fatherName.touched && form.controls.fatherName.invalid" />
        <app-field-error [control]="form.controls.fatherName" errorId="fatherName-error" />
      </div>
      <div class="field">
        <label for="motherName">{{ 'auth.register.motherName' | translate }}</label>
        <input id="motherName" formControlName="motherName" [attr.maxlength]="V.PERSON_NAME_MAX" aria-describedby="motherName-error"
          [attr.aria-invalid]="form.controls.motherName.touched && form.controls.motherName.invalid" />
        <app-field-error [control]="form.controls.motherName" errorId="motherName-error" />
      </div>
      <div class="field span-2">
        <label for="eventDate">{{ 'auth.register.eventDate' | translate }}</label>
        <input id="eventDate" type="datetime-local" formControlName="eventDate" aria-describedby="eventDate-error"
          [attr.aria-invalid]="form.controls.eventDate.touched && form.controls.eventDate.invalid" />
        <app-field-error [control]="form.controls.eventDate" errorId="eventDate-error" />
      </div>
      <div class="field span-2">
        <label for="description">{{ 'auth.register.description' | translate }} <span class="optional">{{ 'common.optional' | translate }}</span></label>
        <textarea id="description" formControlName="description" rows="4" [attr.maxlength]="V.EVENT_DESCRIPTION_MAX"
          [placeholder]="'auth.register.descriptionPlaceholder' | translate" aria-describedby="description-error"></textarea>
        <app-field-error [control]="form.controls.description" errorId="description-error" />
      </div>
      <div class="span-2">
        <button type="submit" class="btn btn-primary" [disabled]="saving() || loading()">
          {{ (saving() ? 'common.saving' : 'common.save') | translate }}
        </button>
      </div>
    </form>
  `,
  styles: `form { max-width: 760px; }`,
})
export class EventPage {
  private readonly api = inject(BabyShowerApi);
  private readonly toast = inject(ToastService);

  protected readonly V = VALIDATION;
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    babyName: ['', [Validators.required, Validators.maxLength(VALIDATION.BABY_NAME_MAX)]],
    fatherName: ['', [Validators.required, Validators.maxLength(VALIDATION.PERSON_NAME_MAX)]],
    motherName: ['', [Validators.required, Validators.maxLength(VALIDATION.PERSON_NAME_MAX)]],
    eventDate: ['', [Validators.required]],
    description: ['', [Validators.maxLength(VALIDATION.EVENT_DESCRIPTION_MAX)]],
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const b = await firstValueFrom(this.api.get());
      this.form.setValue({
        babyName: b.babyName,
        fatherName: b.fatherName,
        motherName: b.motherName,
        eventDate: isoToLocal(b.eventDate),
        description: b.description ?? '',
      });
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    try {
      await firstValueFrom(
        this.api.update({ ...v, eventDate: localToIso(v.eventDate), description: v.description.trim() || null }),
      );
      this.toast.success('event.saved');
    } catch (err) {
      this.error.set(errorKey(err));
    } finally {
      this.saving.set(false);
    }
  }
}
