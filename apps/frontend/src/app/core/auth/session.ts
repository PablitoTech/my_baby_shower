import { Injectable, computed, signal } from '@angular/core';
import type { AuthUser } from '@mbs/contracts';

/**
 * Estado de la sesión en memoria. Los tokens viven en cookies HttpOnly
 * gestionadas por el navegador: nunca se guardan en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  set(user: AuthUser | null): void {
    this._user.set(user);
  }
}
