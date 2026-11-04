import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_CODES } from '@mbs/common';
import type { UserRole } from '@mbs/contracts';
import { ApiException } from '../http/api.exception.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { RequestUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest<{ user?: RequestUser }>().user;
    if (!user || !roles.includes(user.role)) {
      throw new ApiException(HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    return true;
  }
}
