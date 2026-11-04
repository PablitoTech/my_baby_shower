import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/** Los títulos de las rutas son claves de traducción. */
@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private lastKey: string | undefined;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastKey = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    const app = 'My Baby Shower';
    this.title.setTitle(this.lastKey ? `${this.translate.instant(this.lastKey)} · ${app}` : app);
  }
}
