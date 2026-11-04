import { parseDatabaseUrl } from './db/client';
import { randomConfirmationCode, randomSlugSuffix, sha256 } from './crypto';
import { detectImageMime } from './services/images.service';

describe('utilidades del servidor', () => {
  it('separa schema y sslmode de la cadena de conexión', () => {
    const r = parseDatabaseUrl('postgresql://u:p@db.example.com:21506/app?sslmode=require&schema=my_baby_shower_dev');
    expect(r).toEqual({ connectionString: 'postgresql://u:p@db.example.com:21506/app', schema: 'my_baby_shower_dev', sslmode: 'require' });
    expect(() => parseDatabaseUrl('postgresql://u:p@h/app?schema=x"; DROP')).toThrow();
  });

  it('genera identificadores públicos impredecibles', () => {
    expect(randomSlugSuffix()).toMatch(/^[a-z2-9]{10}$/);
    expect(randomConfirmationCode()).toMatch(/^[A-Z2-9]{8}$/);
    expect(new Set(Array.from({ length: 1000 }, () => randomSlugSuffix())).size).toBe(1000);
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('detecta imágenes por su firma, no por la extensión', () => {
    expect(detectImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('image/jpeg');
    expect(detectImageMime(new TextEncoder().encode('RIFF1234WEBPVP8 '))).toBe('image/webp');
    expect(detectImageMime(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull();
  });
});
