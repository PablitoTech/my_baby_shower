import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { AuthUser, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest } from '@mbs/contracts';
import { API } from './api';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  register(body: RegisterRequest) {
    return this.http.post<AuthUser>(`${API}/auth/register`, body);
  }
  login(body: LoginRequest) {
    return this.http.post<AuthUser>(`${API}/auth/login`, body);
  }
  logout() {
    return this.http.post<void>(`${API}/auth/logout`, {});
  }
  me() {
    return this.http.get<AuthUser>(`${API}/auth/me`);
  }
  forgotPassword(body: ForgotPasswordRequest) {
    return this.http.post<void>(`${API}/auth/forgot-password`, body);
  }
  resetPassword(body: ResetPasswordRequest) {
    return this.http.post<void>(`${API}/auth/reset-password`, body);
  }
}
