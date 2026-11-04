import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

/**
 * Hashing de contraseñas con Argon2id (parámetros recomendados por OWASP:
 * 19 MiB de memoria, 2 iteraciones, paralelismo 1 como mínimo; usamos valores superiores).
 */
@Injectable()
export class PasswordService {
  private static readonly OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  } as const;

  // Hash ficticio para igualar tiempos de respuesta cuando el usuario no existe.
  private dummyHash: Promise<string> | null = null;

  hash(password: string): Promise<string> {
    return argon2.hash(password, PasswordService.OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /** Ejecuta una verificación sobre un hash ficticio (mitiga enumeración por tiempo). */
  async verifyDummy(password: string): Promise<void> {
    this.dummyHash ??= this.hash('dummy-password-for-timing');
    await this.verify(await this.dummyHash, password);
  }
}
