import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthUser } from '@mbs/contracts';
import type { AppEnv } from '../config/env.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator.js';
import { AuthService, type IssuedTokens, type SessionContext } from './auth.service.js';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from './auth.cookies.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto.js';

const STRICT = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  @Public()
  @Throttle(STRICT)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthUser> {
    return this.respond(res, await this.auth.register(dto, this.context(req)));
  }

  @Public()
  @Throttle(STRICT)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthUser> {
    return this.respond(res, await this.auth.login(dto, this.context(req)));
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthUser> {
    try {
      return this.respond(res, await this.auth.refresh(this.refreshCookie(req), this.context(req)));
    } catch (error) {
      clearAuthCookies(res, this.secure);
      throw error;
    }
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(this.refreshCookie(req));
    clearAuthCookies(res, this.secure);
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser): Promise<AuthUser> {
    return this.auth.me(user.id);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Throttle(STRICT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto);
  }

  private get secure(): boolean {
    return this.config.get('NODE_ENV', { infer: true }) === 'production';
  }

  private respond(res: Response, tokens: IssuedTokens): AuthUser {
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, {
      secure: this.secure,
      accessMaxAgeMs: 15 * 60_000,
      refreshMaxAgeMs: this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * 86_400_000,
    });
    return tokens.user;
  }

  private refreshCookie(req: Request): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  }

  private context(req: Request): SessionContext {
    return { userAgent: req.get('user-agent'), ipAddress: req.ip };
  }
}
