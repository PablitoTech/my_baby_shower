import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ERROR_CODES } from '@mbs/common';
import type { AuthUser } from '@mbs/contracts';
import type { AppEnv } from '../config/env.js';
import { ApiException } from '../common/http/api.exception.js';
import { randomToken, sha256 } from '../common/utils/crypto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { User } from '../generated/prisma/client.js';
import { MailService } from './mail.service.js';
import { PasswordService } from './password.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ResetPasswordDto } from './dto/password-reset.dto.js';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedTokens {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  /** Crea la cuenta y su Baby Shower en una única transacción. */
  async register(dto: RegisterDto, ctx: SessionContext): Promise<IssuedTokens> {
    if (dto.password !== dto.confirmPassword) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ERROR_CODES.AUTH_PASSWORD_MISMATCH);
    }
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
      select: { email: true },
    });
    if (existing) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        existing.email === dto.email ? ERROR_CODES.AUTH_EMAIL_TAKEN : ERROR_CODES.AUTH_USERNAME_TAKEN,
      );
    }

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        babyShower: {
          create: {
            babyName: dto.babyName,
            fatherName: dto.fatherName,
            motherName: dto.motherName,
            eventDate: new Date(dto.eventDate),
            description: dto.description ?? null,
          },
        },
      },
    });
    return this.issueTokens(user, ctx);
  }

  async login(dto: LoginDto, ctx: SessionContext): Promise<IssuedTokens> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] },
    });

    if (!user || user.status !== 'ACTIVE') {
      await this.passwords.verifyDummy(dto.password);
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_ACCOUNT_LOCKED);
    }

    const valid = await this.passwords.verify(user.passwordHash, dto.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const lock = attempts >= MAX_FAILED_LOGINS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: lock ? 0 : attempts,
          lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil,
        },
      });
      if (lock) this.logger.warn(`Cuenta bloqueada temporalmente por intentos fallidos: ${user.id}`);
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        lock ? ERROR_CODES.AUTH_ACCOUNT_LOCKED : ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    return this.issueTokens(updated, ctx);
  }

  /** Rota el refresh token. Si se reutiliza uno revocado, se cierran todas las sesiones. */
  async refresh(refreshToken: string | undefined, ctx: SessionContext): Promise<IssuedTokens> {
    if (!refreshToken) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_SESSION_EXPIRED);
    }
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    if (!session) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_SESSION_EXPIRED);
    }
    if (session.revokedAt) {
      this.logger.warn(`Reutilización de refresh token detectada; revocando sesiones de ${session.userId}`);
      await this.revokeAllSessions(session.userId);
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_SESSION_EXPIRED);
    }
    if (session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_SESSION_EXPIRED);
    }
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(session.user, ctx);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.session.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
    return this.toAuthUser(user);
  }

  /** Siempre responde igual, exista o no el correo (evita enumeración de cuentas). */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') return;

    const token = randomToken(32);
    const ttl = this.config.get('PASSWORD_RESET_TTL_MINUTES', { infer: true });
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttl * 60_000) },
      }),
    ]);
    const frontendUrl = this.config.get('FRONTEND_URL', { infer: true });
    await this.mail.sendPasswordReset(user.email, `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    if (dto.password !== dto.confirmPassword) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ERROR_CODES.AUTH_PASSWORD_MISMATCH);
    }
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(dto.token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ERROR_CODES.AUTH_INVALID_RESET_TOKEN);
    }
    const passwordHash = await this.passwords.hash(dto.password);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: now } }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      this.prisma.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: now } }),
    ]);
  }

  private async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  private async issueTokens(user: User, ctx: SessionContext): Promise<IssuedTokens> {
    const refreshToken = randomToken(48);
    const days = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + days * 86_400_000),
        userAgent: ctx.userAgent?.slice(0, 255),
        ipAddress: ctx.ipAddress?.slice(0, 45),
      },
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { user: this.toAuthUser(user), accessToken, refreshToken };
  }

  private toAuthUser(user: User): AuthUser {
    return { id: user.id, email: user.email, username: user.username, role: user.role };
  }
}
