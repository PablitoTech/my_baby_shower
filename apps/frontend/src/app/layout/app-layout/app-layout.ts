import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Session } from '../../core/auth/session';
import { LanguageSwitcher } from '../../shared/components/language-switcher';
import { Brand } from '../brand';

@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcher, Brand],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  private readonly auth = inject(AuthService);
  protected readonly session = inject(Session);
  protected readonly menuOpen = signal(false);

  protected readonly links = [
    { path: '/dashboard', key: 'nav.dashboard', icon: '🏡' },
    { path: '/gifts', key: 'nav.gifts', icon: '🎁' },
    { path: '/reservations', key: 'nav.reservations', icon: '📋' },
    { path: '/event', key: 'nav.event', icon: '🗓️' },
  ];

  constructor() {
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }

  protected logout(): void {
    void this.auth.logout();
  }
}
