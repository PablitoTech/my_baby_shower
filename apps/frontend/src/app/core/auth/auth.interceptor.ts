import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { API } from '../api/api';
import { Session } from './session';

/** Endpoints de autenticación que nunca deben disparar un refresco. */
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'];

let refreshInFlight: Observable<unknown> | null = null;

/**
 * Envía las cookies de sesión y, ante un 401, intenta rotar el refresh token
 * una sola vez (compartido entre peticiones concurrentes) y reintenta la petición.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const request = req.url.startsWith(API) ? req.clone({ withCredentials: true }) : req;
  const isPublicApi = req.url.startsWith(`${API}/public/`);
  const skip = isPublicApi || NO_REFRESH.some((path) => req.url.includes(path));

  // HttpClient "crudo" (sin interceptores) para evitar recursión.
  const rawHttp = new HttpClient(inject(HttpBackend));
  const session = inject(Session);
  const injector = inject(Injector);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (skip || !(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      refreshInFlight ??= rawHttp.post(`${API}/auth/refresh`, {}, { withCredentials: true }).pipe(
        shareReplay(1),
        finalize(() => (refreshInFlight = null)),
      );
      return refreshInFlight.pipe(
        switchMap(() => next(request)),
        catchError(() => {
          const wasAuthenticated = session.isAuthenticated();
          session.set(null);
          if (wasAuthenticated) {
            const router = injector.get(Router);
            void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};
