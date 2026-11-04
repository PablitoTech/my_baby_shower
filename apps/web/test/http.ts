import { NextRequest } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: NextRequest, ctx: { params: Promise<any> }) => Promise<Response>;

/** Cliente mínimo que invoca route handlers de Next directamente, con cookies. */
export class TestClient {
  private cookies = new Map<string, string>();

  async call(handler: Handler, options: { method?: string; url?: string; body?: unknown; params?: Record<string, string>; headers?: Record<string, string>; form?: FormData } = {}) {
    const { method = 'GET', url = '/api/v1/test', body, params = {}, headers = {}, form } = options;
    const cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
        host: 'localhost:3000',
        ...headers,
      },
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const res = await handler(req, { params: Promise.resolve(params) });
    for (const raw of res.headers.getSetCookie()) {
      const [pair] = raw.split(';');
      const [name, ...rest] = pair!.split('=');
      const value = rest.join('=');
      if (/max-age=0/i.test(raw) || value === '') this.cookies.delete(name!);
      else this.cookies.set(name!, value);
    }
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, body: json, headers: res.headers };
  }

  cookie(name: string) {
    return this.cookies.get(name);
  }

  setCookie(name: string, value: string) {
    this.cookies.set(name, value);
  }
}
