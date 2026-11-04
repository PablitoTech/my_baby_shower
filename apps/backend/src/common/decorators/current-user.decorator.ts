import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@mbs/contracts';

export interface RequestUser {
  id: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  return ctx.switchToHttp().getRequest<{ user: RequestUser }>().user;
});
