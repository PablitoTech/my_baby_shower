'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, LoginRequest, RegisterRequest } from '@mbs/contracts';
import { api, setSessionExpiredHandler } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  /** true mientras se restaura la sesión al cargar la app. */
  loading: boolean;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Estado de la sesión en memoria. Los tokens viven en cookies HttpOnly que
 * gestiona el navegador: nunca se guardan en localStorage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api<AuthUser>('/auth/me')
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    setSessionExpiredHandler(() => setUser(null));
    return () => {
      active = false;
      setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    setUser(await api<AuthUser>('/auth/login', { method: 'POST', body }));
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    setUser(await api<AuthUser>('/auth/register', { method: 'POST', body }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/');
    }
  }, [router]);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

/** Solo permite rutas internas (evita redirecciones abiertas). */
export function safeReturnUrl(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}
