import { Injectable, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { LoginRequest, RegisterRequest } from '@mbs/contracts';
import { AuthApi } from '../api/auth-api';
import { Session } from './session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly session = inject(Session);
  // El Router se resuelve bajo demanda: este servicio se usa en el inicializador de la app.
  private readonly injector = inject(Injector);

  /** Recupera la sesión al iniciar la app (el interceptor intenta refrescarla si expiró). */
  async restore(): Promise<void> {
    try {
      this.session.set(await firstValueFrom(this.api.me()));
    } catch {
      this.session.set(null);
    }
  }

  async login(body: LoginRequest): Promise<void> {
    this.session.set(await firstValueFrom(this.api.login(body)));
  }

  async register(body: RegisterRequest): Promise<void> {
    this.session.set(await firstValueFrom(this.api.register(body)));
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } finally {
      this.session.set(null);
      await this.injector.get(Router).navigateByUrl('/');
    }
  }
}
