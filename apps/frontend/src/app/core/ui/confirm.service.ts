import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  messageKey: string;
  params?: Record<string, unknown>;
  confirmKey?: string;
  danger?: boolean;
  resolve: (value: boolean) => void;
}

/** Diálogo de confirmación accesible (reemplaza window.confirm). */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);

  ask(messageKey: string, options: Omit<ConfirmRequest, 'messageKey' | 'resolve'> = {}): Promise<boolean> {
    return new Promise((resolve) => this.request.set({ messageKey, ...options, resolve }));
  }

  answer(value: boolean): void {
    this.request()?.resolve(value);
    this.request.set(null);
  }
}
