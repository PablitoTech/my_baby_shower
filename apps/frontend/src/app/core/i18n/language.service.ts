import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, isSupportedLanguage, type Language } from '@mbs/common';

const STORAGE_KEY = 'mbs.lang';

/**
 * Idioma de la interfaz. Por defecto español; la preferencia del usuario
 * (dato no sensible) se recuerda en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly languages = SUPPORTED_LANGUAGES;
  readonly current = signal<Language>(DEFAULT_LANGUAGE);
  /** Locale de Angular para formatear fechas y números. */
  readonly locale = computed(() => (this.current() === 'es' ? 'es' : 'en-US'));

  init(): Promise<unknown> {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
    return this.use(isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE);
  }

  use(lang: Language): Promise<unknown> {
    this.current.set(lang);
    this.document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* almacenamiento no disponible */
    }
    return firstValueFrom(this.translate.use(lang));
  }

  instant(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params) as string;
  }
}
