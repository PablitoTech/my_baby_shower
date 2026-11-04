import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/components/toast-host';
import { ConfirmDialog } from './shared/components/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost, ConfirmDialog],
  template: `
    <router-outlet />
    <app-toast-host />
    <app-confirm-dialog />
  `,
})
export class App {}
