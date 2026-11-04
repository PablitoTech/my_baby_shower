'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './modal';

interface ConfirmOptions {
  params?: Record<string, unknown>;
  confirmKey?: string;
  danger?: boolean;
}
interface Request extends ConfirmOptions {
  messageKey: string;
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<((messageKey: string, options?: ConfirmOptions) => Promise<boolean>) | null>(null);

/** Diálogo de confirmación accesible (reemplaza window.confirm). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [request, setRequest] = useState<Request | null>(null);

  const ask = useCallback(
    (messageKey: string, options: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => setRequest({ messageKey, ...options, resolve })),
    [],
  );
  const answer = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Modal open={!!request} heading={t('common.confirm')} onClose={() => answer(false)}>
        {request && (
          <>
            <p>{t(request.messageKey, request.params)}</p>
            <div className="c-confirm-actions">
              <button type="button" className="btn btn-ghost" onClick={() => answer(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className={`btn ${request.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => answer(true)}>
                {t(request.confirmKey ?? 'common.confirm')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx;
}
