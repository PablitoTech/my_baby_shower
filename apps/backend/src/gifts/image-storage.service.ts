import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ERROR_CODES, IMAGE_UPLOAD } from '@mbs/common';
import type { AppEnv } from '../config/env.js';
import { ApiException } from '../common/http/api.exception.js';
import { randomToken } from '../common/utils/crypto.js';

type ImageKind = 'jpg' | 'png' | 'webp';

/** Detecta el tipo real por la firma del archivo (no confía en el nombre ni en el MIME declarado). */
function detectImage(buffer: Buffer): ImageKind | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

@Injectable()
export class ImageStorageService {
  private readonly logger = new Logger(ImageStorageService.name);
  private readonly root: string;

  constructor(config: ConfigService<AppEnv, true>) {
    this.root = config.get('UPLOADS_DIR', { infer: true });
  }

  /** Guarda la imagen con un nombre aleatorio y devuelve la ruta relativa. */
  async saveGiftImage(file: Express.Multer.File | undefined): Promise<string> {
    if (!file || file.size > IMAGE_UPLOAD.MAX_BYTES) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ERROR_CODES.INVALID_IMAGE);
    }
    const kind = detectImage(file.buffer);
    if (!kind) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ERROR_CODES.INVALID_IMAGE);
    }
    const relative = `gifts/${randomToken(18)}.${kind}`;
    const target = path.join(this.root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.buffer, { flag: 'wx' });
    return relative;
  }

  async remove(relative: string | null): Promise<void> {
    if (!relative) return;
    const target = path.resolve(this.root, relative);
    if (!target.startsWith(path.resolve(this.root) + path.sep)) return; // evita path traversal
    try {
      await unlink(target);
    } catch {
      this.logger.warn(`No se pudo eliminar la imagen ${relative}`);
    }
  }
}
