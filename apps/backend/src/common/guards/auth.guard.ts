import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ERROR_CODES } from '@mbs/common';
import type { UserRole } from '@mbs/contracts';
import { ApiException } from '../http/api.exception.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ACCESS_COOKIE } from '../../auth/auth.cookies.js';

interface AccessPayload {
  sub: string;
  role: UserRole;
}

/**
 * Guard global: todos los endpoints requieren sesión salvo los marcados con @Public().
 * El token de acceso viaja en una cookie HttpOnly (no accesible desde JavaScript).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = (request.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
    if (!token) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_SESSION_EXPIRED);
    }
  }
}
