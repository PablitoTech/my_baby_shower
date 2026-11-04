import type { UserRole } from './enums';

export interface RegisterRequest {
  fatherName: string;
  motherName: string;
  babyName: string;
  eventDate: string; // ISO 8601
  description?: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  /** Correo electrónico o nombre de usuario. */
  identifier: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}
