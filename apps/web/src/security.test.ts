import { NextRequest } from 'next/server';
import { safeReturnUrl } from './client/auth';
import { clientIp, readLimitedBody } from './server/http/handler';

const ORIGIN = 'http://localhost:3000';

describe('seguridad', () => {
  it('safeReturnUrl solo permite rutas internas', () => {
    expect(safeReturnUrl('/gifts?x=1#a', ORIGIN)).toBe('/gifts?x=1#a');
    // `/%0a//evil` es seguro: el navegador lo resuelve como ruta interna del mismo origen.
    expect(safeReturnUrl('/%0a//evil', ORIGIN)).toBe('/%0a//evil');
    for (const evil of ['//evil.example', '/\\evil.example', '/\\/evil.example', 'https://evil.example', 'javascript:alert(1)', '/\n//evil.example', null, '']) {
      expect(safeReturnUrl(evil as string | null, ORIGIN)).toBe('/dashboard');
    }
  });

  it('clientIp prioriza la cabecera de Vercel e ignora valores que no son IPs', () => {
    const req = (h: Record<string, string>) => new NextRequest(`${ORIGIN}/x`, { headers: h });
    expect(clientIp(req({ 'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' }))).toBe('203.0.113.7');
    expect(clientIp(req({ 'x-forwarded-for': '198.51.100.2, 10.0.0.1' }))).toBe('198.51.100.2');
    expect(clientIp(req({ 'x-forwarded-for': 'a'.repeat(300) }))).toBe('unknown');
  });

  it('readLimitedBody corta cuerpos grandes aunque no declaren Content-Length', async () => {
    const stream = new ReadableStream({
      start(c) {
        for (let i = 0; i < 20; i++) c.enqueue(new Uint8Array(10_000));
        c.close();
      },
    });
    const init = { method: 'POST', body: stream, duplex: 'half' };
    const req = new NextRequest(`${ORIGIN}/x`, init as ConstructorParameters<typeof NextRequest>[1]);
    await expect(readLimitedBody(req, 100_000)).rejects.toMatchObject({ status: 413 });
  });
});
