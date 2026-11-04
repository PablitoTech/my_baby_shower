import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import path from 'node:path';
import { config } from 'dotenv';

const root = path.resolve(import.meta.dirname, '..', '..', '..');
const env = config({ path: path.join(root, 'environment.m'), processEnv: {}, quiet: true }).parsed ?? {};
const testUrl = `postgresql://${encodeURIComponent(env.DB_USER!)}:${encodeURIComponent(env.DB_PASSWORD!)}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}_test?schema=public`;
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: testUrl });

const { AppModule } = await import('../src/app.module.js');
const { setupApp } = await import('../src/setup-app.js');
const { PrismaService } = await import('../src/prisma/prisma.service.js');

const PASSWORD = 'IntegracionTest1';

function registration(suffix: string) {
  return {
    fatherName: 'Padre',
    motherName: 'Madre',
    babyName: 'Lucía',
    eventDate: '2027-01-15T15:00:00.000Z',
    email: `user${suffix}@example.test`,
    username: `user${suffix}`,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  };
}

describe('my_baby_shower API (integración)', () => {
  let app: NestExpressApplication;
  let http: App;
  let prisma: InstanceType<typeof PrismaService>;
  let cookies: string[];
  let categoryId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    setupApp(app);
    await app.init();
    http = app.getHttpServer() as App;
    prisma = app.get(PrismaService);
    await prisma.user.deleteMany();

    const res = await request(http).post('/api/auth/register').send(registration('a')).expect(201);
    cookies = res.get('Set-Cookie') ?? [];
    const categories = await request(http).get('/api/categories').set('Cookie', cookies).expect(200);
    categoryId = categories.body[0].id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('autenticación', () => {
    it('guarda la contraseña con Argon2id y usa cookies HttpOnly', async () => {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: 'usera@example.test' } });
      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
      expect(cookies.join(';')).toMatch(/mbs_at=.*HttpOnly/);
      expect(cookies.join(';')).toMatch(/mbs_rt=.*HttpOnly/);
    });

    it('rechaza correos duplicados', async () => {
      const res = await request(http).post('/api/auth/register').send({ ...registration('a'), username: 'otro' }).expect(409);
      expect(res.body.code).toBe('AUTH_EMAIL_TAKEN');
    });

    it('rechaza contraseñas que no coinciden y campos desconocidos', async () => {
      await request(http).post('/api/auth/register').send({ ...registration('b'), confirmPassword: 'Distinta123' }).expect(400);
      const res = await request(http).post('/api/auth/register').send({ ...registration('c'), isAdmin: true }).expect(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('protege las rutas privadas', async () => {
      const res = await request(http).get('/api/gifts').expect(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('inicia sesión con usuario o correo y rechaza credenciales erróneas', async () => {
      await request(http).post('/api/auth/login').send({ identifier: 'USERA', password: PASSWORD }).expect(200);
      const bad = await request(http).post('/api/auth/login').send({ identifier: 'usera@example.test', password: 'Incorrecta1' }).expect(401);
      expect(bad.body.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('bloquea la cuenta tras 5 intentos fallidos', async () => {
      await request(http).post('/api/auth/register').send(registration('lock')).expect(201);
      for (let i = 0; i < 4; i++) {
        await request(http).post('/api/auth/login').send({ identifier: 'userlock', password: 'Mala12345' }).expect(401);
      }
      const locked = await request(http).post('/api/auth/login').send({ identifier: 'userlock', password: 'Mala12345' }).expect(401);
      expect(locked.body.code).toBe('AUTH_ACCOUNT_LOCKED');
      const evenCorrect = await request(http).post('/api/auth/login').send({ identifier: 'userlock', password: PASSWORD }).expect(401);
      expect(evenCorrect.body.code).toBe('AUTH_ACCOUNT_LOCKED');
    });

    it('rota el refresh token y detecta su reutilización', async () => {
      const login = await request(http).post('/api/auth/login').send({ identifier: 'usera', password: PASSWORD }).expect(200);
      const first = login.get('Set-Cookie') ?? [];
      const refreshed = await request(http).post('/api/auth/refresh').set('Cookie', first).expect(200);
      expect(refreshed.get('Set-Cookie')?.join(';')).toMatch(/mbs_rt=/);
      // Reutilizar el token ya rotado revoca la sesión.
      await request(http).post('/api/auth/refresh').set('Cookie', first).expect(401);
    });

    it('recupera la contraseña con un token de un solo uso', async () => {
      await request(http).post('/api/auth/forgot-password').send({ email: 'nadie@example.test' }).expect(204);
      await request(http).post('/api/auth/register').send(registration('reset')).expect(201);
      await request(http).post('/api/auth/forgot-password').send({ email: 'userreset@example.test' }).expect(204);

      // El token solo se guarda como hash: se inserta uno conocido para la prueba.
      const { sha256 } = await import('../src/common/utils/crypto.js');
      const user = await prisma.user.findUniqueOrThrow({ where: { username: 'userreset' } });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256('token-de-prueba'), expiresAt: new Date(Date.now() + 60_000) },
      });
      const body = { token: 'token-de-prueba', password: 'NuevaClave123', confirmPassword: 'NuevaClave123' };
      await request(http).post('/api/auth/reset-password').send(body).expect(204);
      await request(http).post('/api/auth/reset-password').send(body).expect(400);
      await request(http).post('/api/auth/login').send({ identifier: 'userreset', password: 'NuevaClave123' }).expect(200);
    });
  });

  describe('regalos, publicación y reservas', () => {
    let giftId: string;
    let slug: string;
    let publicGiftId: string;

    it('crea un regalo y valida cantidades', async () => {
      const res = await request(http)
        .post('/api/gifts')
        .set('Cookie', cookies)
        .send({ name: '  Pañales  ', description: 'Etapa 3', categoryId, quantityRequired: 3 })
        .expect(201);
      expect(res.body).toMatchObject({ name: 'Pañales', status: 'AVAILABLE', quantityAvailable: 3 });
      giftId = res.body.id;
      await request(http).post('/api/gifts').set('Cookie', cookies).send({ name: 'X', categoryId, quantityRequired: 0 }).expect(400);
    });

    it('no expone el Baby Shower antes de publicarlo', async () => {
      const bs = await prisma.babyShower.findFirstOrThrow({ where: { user: { username: 'usera' } } });
      expect(bs.publicSlug).toBeNull();
    });

    it('publica con un enlace no predecible que no expone IDs internos', async () => {
      const res = await request(http).post('/api/baby-shower/publish').set('Cookie', cookies).expect(200);
      slug = res.body.publicSlug;
      expect(slug).toMatch(/^lucia-[a-z0-9]{10}$/);
      const pub = await request(http).get(`/api/public/baby-showers/${slug}`).expect(200);
      expect(JSON.stringify(pub.body)).not.toContain(giftId);
      expect(pub.body).not.toHaveProperty('id');
      publicGiftId = pub.body.gifts[0].publicId;
    });

    it('serializa reservas concurrentes sin superar la cantidad disponible', async () => {
      const attempts = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          request(http)
            .post(`/api/public/baby-showers/${slug}/gifts/${publicGiftId}/reservations`)
            .send({ guestName: `Invitado ${i}`, quantity: 1 }),
        ),
      );
      const statuses = attempts.map((r) => r.status).sort();
      expect(statuses.filter((s) => s === 201)).toHaveLength(3);
      expect(statuses.filter((s) => s === 409)).toHaveLength(3);
      const gift = await prisma.gift.findUniqueOrThrow({ where: { id: giftId } });
      expect(gift).toMatchObject({ quantityReserved: 3, status: 'RESERVED' });

      // Agotado: deja de aparecer en la lista pública.
      const pub = await request(http).get(`/api/public/baby-showers/${slug}`).expect(200);
      expect(pub.body.gifts.find((g: { publicId: string }) => g.publicId === publicGiftId)).toBeUndefined();
      expect(pub.body.hasFullyReservedGifts).toBe(true);
    });

    it('no permite bajar la cantidad por debajo de lo reservado', async () => {
      const res = await request(http).patch(`/api/gifts/${giftId}`).set('Cookie', cookies).send({ quantityRequired: 2 }).expect(409);
      expect(res.body.code).toBe('GIFT_QUANTITY_BELOW_RESERVED');
    });

    it('permite a los padres cancelar y marcar como entregado', async () => {
      const list = await request(http).get(`/api/reservations?giftId=${giftId}`).set('Cookie', cookies).expect(200);
      expect(list.body).toHaveLength(3);
      const [first, second] = list.body;

      await request(http).patch(`/api/reservations/${first.id}/status`).set('Cookie', cookies).send({ status: 'CANCELLED' }).expect(200);
      let gift = await prisma.gift.findUniqueOrThrow({ where: { id: giftId } });
      expect(gift).toMatchObject({ quantityReserved: 2, status: 'PARTIALLY_RESERVED' });

      const invalid = await request(http).patch(`/api/reservations/${first.id}/status`).set('Cookie', cookies).send({ status: 'DELIVERED' }).expect(409);
      expect(invalid.body.code).toBe('RESERVATION_INVALID_TRANSITION');

      await request(http).patch(`/api/reservations/${second.id}/status`).set('Cookie', cookies).send({ status: 'DELIVERED' }).expect(200);
      gift = await prisma.gift.findUniqueOrThrow({ where: { id: giftId } });
      expect(gift.quantityReserved).toBe(2);

      const delivered = await request(http).get('/api/reservations?status=DELIVERED').set('Cookie', cookies).expect(200);
      expect(delivered.body).toHaveLength(1);
    });

    it('impide que otro usuario acceda a los regalos o reservas ajenos', async () => {
      const other = await request(http).post('/api/auth/register').send(registration('z')).expect(201);
      const otherCookies = other.get('Set-Cookie') ?? [];
      await request(http).patch(`/api/gifts/${giftId}`).set('Cookie', otherCookies).send({ name: 'Hack' }).expect(404);
      const res = await request(http).get('/api/reservations').set('Cookie', otherCookies).expect(200);
      expect(res.body).toHaveLength(0);
    });

    it('bloquea el borrado con reservas activas y oculta la página al despublicar', async () => {
      const res = await request(http).delete(`/api/gifts/${giftId}`).set('Cookie', cookies).expect(409);
      expect(res.body.code).toBe('GIFT_HAS_ACTIVE_RESERVATIONS');
      await request(http).post('/api/baby-shower/unpublish').set('Cookie', cookies).expect(200);
      await request(http).get(`/api/public/baby-showers/${slug}`).expect(404);
    });

    it('resume los datos en el dashboard', async () => {
      const res = await request(http).get('/api/baby-shower/dashboard').set('Cookie', cookies).expect(200);
      expect(res.body.gifts).toMatchObject({ total: 1, partiallyReserved: 1, unitsRequired: 3, unitsReserved: 2 });
      expect(res.body.reservations).toMatchObject({ total: 3, cancelled: 1, delivered: 1, pending: 1 });
    });
  });
});
