'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  heading: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modal accesible basado en <dialog>: atrapa el foco y se cierra con Escape. */
export function Modal({ open, heading, onClose, children }: ModalProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="c-modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="modal-card">
        <header>
          <h2 id={titleId}>{heading}</h2>
          <button type="button" className="close" onClick={() => ref.current?.close()} aria-label={t('common.close')}>
            ×
          </button>
        </header>
        {open ? children : null}
      </div>
    </dialog>
  );
}
