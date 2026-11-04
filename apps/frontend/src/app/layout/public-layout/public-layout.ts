import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { Session } from '../../core/auth/session';
import { LanguageSwitcher } from '../../shared/components/language-switcher';
import { Brand } from '../brand';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, TranslatePipe, LanguageSwitcher, Brand],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  protected readonly session = inject(Session);
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }
}
