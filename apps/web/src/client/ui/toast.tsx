'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Kind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  key: string;
  params?: Record<string, unknown>;
  kind: Kind;
}
interface ToastApi {
  success: (key: string, params?: Record<string, unknown>) => void;
  error: (key: string, params?: Record<string, unknown>) => void;
  info: (key: string, params?: Record<string, unknown>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (kind: Kind, key: string, params?: Record<string, unknown>) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, key, params, kind }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );
  const api = useMemo<ToastApi>(
    () => ({
      success: (k, p) => push('success', k, p),
      error: (k, p) => push('error', k, p),
      info: (k, p) => push('info', k, p),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="c-toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`} role="status">
            <span>{t(toast.key, toast.params)}</span>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label={t('common.close')}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
