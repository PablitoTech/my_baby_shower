'use client';

import { ERROR_CODES, type ApiErrorBody } from '@mbs/common';

export const API = '/api/v1';

/** Error de la API con el código de negocio ya resuelto. */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

/** Clave de traducción `errors.<CODIGO>` para cualquier error. */
export function errorKey(error: unknown): string {
  if (error instanceof ApiClientError && error.code in ERROR_CODES) return `errors.${error.code}`;
  if (error instanceof ApiClientError && error.status === 0) return 'errors.NETWORK';
  return 'errors.INTERNAL_ERROR';
}

export function errorCode(error: unknown): string | null {
  return error instanceof ApiClientError ? error.code : null;
}

/** Endpoints que nunca disparan un refresco de sesión. */
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'];

let refreshInFlight: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'same-origin' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | undefined | null>;
}

async function send(path: string, { method = 'GET', body, query }: RequestOptions): Promise<Response> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v) params.set(k, v);
  const url = `${API}${path}${params.size ? `?${params}` : ''}`;
  const isForm = body instanceof FormData;
  return fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body === undefined || isForm ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
}

/**
 * Llama a la API. Ante un 401 intenta rotar la sesión una sola vez
 * (compartida entre peticiones concurrentes) y reintenta.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await send(path, options);
    const canRefresh = !path.startsWith('/public/') && !NO_REFRESH.some((p) => path.startsWith(p));
    if (res.status === 401 && canRefresh) {
      if (await refreshSession()) {
        res = await send(path, options);
      } else {
        onSessionExpired?.();
      }
    }
  } catch {
    throw new ApiClientError(0, 'NETWORK');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null;
    throw new ApiClientError(res.status, body?.code ?? (res.status === 429 ? 'TOO_MANY_REQUESTS' : 'INTERNAL_ERROR'));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
