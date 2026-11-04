import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  key: string;
  params?: Record<string, unknown>;
  kind: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(key: string, params?: Record<string, unknown>) {
    this.push({ key, params, kind: 'success' });
  }
  error(key: string, params?: Record<string, unknown>) {
    this.push({ key, params, kind: 'error' });
  }
  info(key: string, params?: Record<string, unknown>) {
    this.push({ key, params, kind: 'info' });
  }
  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(toast: Omit<Toast, 'id'>) {
    const id = this.nextId++;
    this.toasts.update((list) => [...list.slice(-3), { ...toast, id }]);
    setTimeout(() => this.dismiss(id), 4500);
  }
}
