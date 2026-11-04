import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

/** Protege las rutas privadas: redirige a /login conservando la URL de destino. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(Session);
  if (session.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Evita que un usuario autenticado vea las páginas de login/registro. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(Session);
  return session.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
