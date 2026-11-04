import { isIP } from 'node:net';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { ERROR_CODES, type ApiErrorBody } from '@mbs/common';
import { Prisma } from '../../generated/prisma/client';
import { env, isProduction } from '../env';
import { ApiError } from './errors';

const MAX_JSON_BYTES = 100 * 1024;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type Handler<P> = (req: NextRequest, params: P) => Promise<Response>;

/**
 * Envuelve un route handler:
 * - rechaza peticiones que modifican datos desde otro origen (defensa CSRF),
 * - normaliza todos los errores a { statusCode, code, message, details? },
 * - nunca expone stack traces ni detalles internos.
 */
export function route<P extends Record<string, string> = Record<string, never>>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }): Promise<Response> => {
    try {
      assertSameOrigin(req);
      return await handler(req, ctx?.params ? await ctx.params : ({} as P));
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Lee el cuerpo como bytes sin superar `maxBytes`, aunque la petición no
 * declare Content-Length (transferencia por bloques). Evita agotar la memoria.
 */
export async function readLimitedBody(req: NextRequest, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new ApiError(413, ERROR_CODES.VALIDATION_FAILED, 'Payload too large');
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new ApiError(413, ERROR_CODES.VALIDATION_FAILED, 'Payload too large');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/** Lee y valida el cuerpo JSON (máx. 100 KB) con un esquema zod. */
export async function readBody<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.output<S>> {
  const raw = await readLimitedBody(req, MAX_JSON_BYTES);
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new ApiError(400, ERROR_CODES.VALIDATION_FAILED, 'Invalid JSON');
  }
  return validate(schema, body);
}

/** Lee un multipart/form-data sin superar `maxBytes`. */
export async function readFormData(req: NextRequest, maxBytes: number): Promise<FormData> {
  const raw = await readLimitedBody(req, maxBytes);
  return new Request('http://local/', { method: 'POST', headers: { 'content-type': req.headers.get('content-type') ?? '' }, body: raw }).formData();
}

/** Valida los parámetros de búsqueda de la URL. */
export function readQuery<S extends z.ZodType>(req: NextRequest, schema: S): z.output<S> {
  const raw = Object.fromEntries([...req.nextUrl.searchParams.entries()].filter(([, v]) => v !== ''));
  return validate(schema, raw);
}

export function validate<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = isProduction()
      ? undefined
      : result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new ApiError(400, ERROR_CODES.VALIDATION_FAILED, 'Validation failed', details);
  }
  return result.data;
}

function assertSameOrigin(req: NextRequest): void {
  if (SAFE_METHODS.has(req.method)) return;
  // Los navegadores modernos marcan las peticiones de otros sitios.
  if (req.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403, ERROR_CODES.FORBIDDEN);
  const origin = req.headers.get('origin');
  if (!origin) return; // clientes no navegador (curl, pruebas): las cookies SameSite ya protegen al navegador
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const allowed = (env().ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, ERROR_CODES.FORBIDDEN);
  }
  if (originHost !== host && !allowed.includes(origin)) {
    throw new ApiError(403, ERROR_CODES.FORBIDDEN);
  }
}

export function errorResponse(error: unknown): NextResponse {
  let body: ApiErrorBody;
  if (error instanceof ApiError) {
    body = { statusCode: error.status, code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    body = { statusCode: 404, code: ERROR_CODES.NOT_FOUND, message: 'Not found' };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    body = { statusCode: 409, code: ERROR_CODES.VALIDATION_FAILED, message: 'Duplicate value' };
  } else {
    // Solo se registra en el servidor; el cliente recibe un mensaje genérico.
    console.error('[api] Error no controlado:', error instanceof Error ? error.stack : error);
    body = { statusCode: 500, code: ERROR_CODES.INTERNAL_ERROR, message: 'Internal server error' };
  }
  return NextResponse.json(body, { status: body.statusCode, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * IP del cliente para rate limiting. Se prioriza la cabecera que fija Vercel
 * (el cliente no puede falsearla) y solo se aceptan IPs válidas, para que un
 * valor arbitrario no cree claves nuevas ni provoque errores.
 */
export function clientIp(req: NextRequest): string {
  const candidates = [
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0],
    req.headers.get('x-real-ip'),
    req.headers.get('x-forwarded-for')?.split(',')[0],
  ];
  for (const raw of candidates) {
    const ip = raw?.trim();
    if (ip && isIP(ip)) return ip;
  }
  return 'unknown';
}
