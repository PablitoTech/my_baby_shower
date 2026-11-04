import type { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { PublicLayout } from './layout/public-layout/public-layout';
import { AppLayout } from './layout/app-layout/app-layout';

/** Los títulos son claves de traducción (ver TranslatedTitleStrategy). */
export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', pathMatch: 'full', title: 'nav.home', loadComponent: () => import('./features/landing/landing').then((m) => m.LandingPage) },
      { path: 'login', title: 'nav.login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage) },
      { path: 'register', title: 'nav.register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage) },
      { path: 'forgot-password', title: 'auth.forgot.title', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage) },
      { path: 'reset-password', title: 'auth.reset.title', loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPasswordPage) },
      { path: 'baby-shower/:slug', title: 'public.giftsTitle', loadComponent: () => import('./features/public-baby-shower/public-baby-shower').then((m) => m.PublicBabyShowerPage) },
    ],
  },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', title: 'nav.dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'gifts', title: 'nav.gifts', loadComponent: () => import('./features/gifts/gifts').then((m) => m.GiftsPage) },
      { path: 'reservations', title: 'nav.reservations', loadComponent: () => import('./features/reservations/reservations').then((m) => m.ReservationsPage) },
      { path: 'event', title: 'nav.event', loadComponent: () => import('./features/event/event').then((m) => m.EventPage) },
    ],
  },
  {
    path: '**',
    component: PublicLayout,
    children: [{ path: '', title: 'notFound.title', loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundPage) }],
  },
];
