'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

/** Campo de contraseña con botón para mostrar/ocultar. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  function PasswordInput(props, ref) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    return (
      <div className="password-wrap">
        <input ref={ref} type={visible ? 'text' : 'password'} {...props} />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}>
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
    );
  },
);
