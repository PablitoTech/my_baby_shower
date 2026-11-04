import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { Language } from '@mbs/common';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  template: `
    <div class="switch" role="group" [attr.aria-label]="'common.language' | translate">
      @for (lang of language.languages; track lang) {
        <button
          type="button"
          [class.active]="language.current() === lang"
          [attr.aria-pressed]="language.current() === lang"
          [attr.lang]="lang"
          [attr.title]="'lang.' + lang | translate"
          (click)="select(lang)"
        >
          {{ lang.toUpperCase() }}
        </button>
      }
    </div>
  `,
  styles: `
    .switch { display: inline-flex; padding: 3px; border-radius: 999px; background: var(--c-lavender); }
    button {
      min-width: 40px; min-height: 32px; border: 0; border-radius: 999px; background: transparent;
      font: 700 0.8rem var(--font-body); color: var(--c-ink-soft); cursor: pointer; transition: background-color .2s, color .2s;
    }
    button.active { background: #fff; color: var(--c-lavender-deep); box-shadow: var(--shadow-sm); }
  `,
})
export class LanguageSwitcher {
  protected readonly language = inject(LanguageService);

  protected select(lang: Language): void {
    void this.language.use(lang);
  }
}
