import { TestClient } from './http';
import * as health from '@/app/api/v1/health/route';
import * as register from '@/app/api/v1/auth/register/route';
import * as login from '@/app/api/v1/auth/login/route';
import * as refresh from '@/app/api/v1/auth/refresh/route';
import * as logout from '@/app/api/v1/auth/logout/route';
import * as me from '@/app/api/v1/auth/me/route';
import * as forgot from '@/app/api/v1/auth/forgot-password/route';
import * as reset from '@/app/api/v1/auth/reset-password/route';
import * as categories from '@/app/api/v1/categories/route';
import * as gifts from '@/app/api/v1/gifts/route';
import * as gift from '@/app/api/v1/gifts/[id]/route';
import * as giftImage from '@/app/api/v1/gifts/[id]/image/route';
import * as images from '@/app/api/v1/images/[id]/route';
import * as publish from '@/app/api/v1/baby-shower/publish/route';
import * as unpublish from '@/app/api/v1/baby-shower/unpublish/route';
import * as dashboard from '@/app/api/v1/baby-shower/dashboard/route';
import * as publicShower from '@/app/api/v1/public/baby-showers/[slug]/route';
import * as reserve from '@/app/api/v1/public/baby-showers/[slug]/gifts/[giftId]/reservations/route';
import * as reservations from '@/app/api/v1/reservations/route';
import * as reservationStatus from '@/app/api/v1/reservations/[id]/status/route';
import { db } from '@/server/db/prisma';
import { sha256 } from '@/server/crypto';

const PASSWORD = 'IntegracionTest1';
const registration = (suffix: string) => ({
  fatherName: 'Padre',
  motherName: 'Madre',
  babyName: 'Lucía',
  eventDate: '2027-01-15T15:00:00.000Z',
  email: `user${suffix}@example.test`,
  username: `user${suffix}`,
  password: PASSWORD,
  confirmPassword: PASSWORD,
});

describe('API my_baby_shower (integración con PostgreSQL)', () => {
  const parent = new TestClient();
  let categoryId: string;

  beforeAll(async () => {
    await db().user.deleteMany();
    const res = await parent.call(register.POST, { method: 'POST', body: registration('a') });
    expect(res.status).toBe(201);
    categoryId = (await parent.call(categories.GET)).body[0].id;
  });

  afterAll(async () => {
    await db().user.deleteMany();
    await db().$disconnect();
  });

  it('health verifica la base de datos', async () => {
    expect((await new TestClient().call(health.GET)).body).toEqual({ status: 'ok', database: 'up' });
  });

  describe('autenticación', () => {
    it('guarda la contraseña con Argon2id y usa cookies HttpOnly', async () => {
      const user = await db().user.findUniqueOrThrow({ where: { email: 'usera@example.test' } });
      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
      const c = new TestClient();
      const res = await c.call(login.POST, { method: 'POST', body: { identifier: 'usera', password: PASSWORD } });
      const setCookie = res.headers.getSetCookie().join('\n');
      expect(setCookie).toMatch(/mbs_at=.*HttpOnly/i);
      expect(setCookie).toMatch(/mbs_rt=.*Path=\/api\/v1\/auth.*HttpOnly/i);
    });

    it('rechaza duplicados, contraseñas distintas y campos desconocidos', async () => {
      const dup = await new TestClient().call(register.POST, { method: 'POST', body: { ...registration('a'), username: 'otro' } });
      expect(dup).toMatchObject({ status: 409, body: { code: 'AUTH_EMAIL_TAKEN' } });
      const mismatch = await new TestClient().call(register.POST, { method: 'POST', body: { ...registration('b'), confirmPassword: 'Distinta123' } });
      expect(mismatch.status).toBe(400);
      const extra = await new TestClient().call(register.POST, { method: 'POST', body: { ...registration('c'), isAdmin: true } });
      expect(extra).toMatchObject({ status: 400, body: { code: 'VALIDATION_FAILED' } });
    });

    it('rechaza peticiones que modifican datos desde otro origen', async () => {
      const res = await new TestClient().call(login.POST, { method: 'POST', body: {}, headers: { origin: 'https://evil.example' } });
      expect(res).toMatchObject({ status: 403, body: { code: 'FORBIDDEN' } });
    });

    it('protege las rutas privadas', async () => {
      expect((await new TestClient().call(gifts.GET)).body.code).toBe('UNAUTHORIZED');
      const forged = new TestClient();
      forged.setCookie('mbs_at', 'token.falso.firma');
      expect((await forged.call(me.GET)).status).toBe(401);
    });

    it('bloquea la cuenta tras 5 intentos fallidos', async () => {
      await new TestClient().call(register.POST, { method: 'POST', body: registration('lock') });
      const c = new TestClient();
      for (let i = 0; i < 4; i++) {
        expect((await c.call(login.POST, { method: 'POST', body: { identifier: 'userlock', password: 'Mala12345' } })).status).toBe(401);
      }
      const locked = await c.call(login.POST, { method: 'POST', body: { identifier: 'userlock', password: 'Mala12345' } });
      expect(locked.body.code).toBe('AUTH_ACCOUNT_LOCKED');
      const correct = await c.call(login.POST, { method: 'POST', body: { identifier: 'userlock', password: PASSWORD } });
      expect(correct.body.code).toBe('AUTH_ACCOUNT_LOCKED');
    });

    it('rota el refresh token, detecta su reutilización y cierra sesión', async () => {
      const c = new TestClient();
      await c.call(login.POST, { method: 'POST', body: { identifier: 'usera', password: PASSWORD } });
      const first = c.cookie('mbs_rt')!;
      expect((await c.call(refresh.POST, { method: 'POST' })).status).toBe(200);
      expect(c.cookie('mbs_rt')).not.toBe(first);

      const attacker = new TestClient();
      attacker.setCookie('mbs_rt', first);
      expect((await attacker.call(refresh.POST, { method: 'POST' })).status).toBe(401);
      // La reutilización revoca también la sesión legítima.
      expect((await c.call(refresh.POST, { method: 'POST' })).status).toBe(401);

      const d = new TestClient();
      await d.call(login.POST, { method: 'POST', body: { identifier: 'usera', password: PASSWORD } });
      expect((await d.call(logout.POST, { method: 'POST' })).status).toBe(204);
      expect((await d.call(me.GET)).status).toBe(401);
    });

    it('recupera la contraseña con un token de un solo uso', async () => {
      expect((await new TestClient().call(forgot.POST, { method: 'POST', body: { email: 'nadie@example.test' } })).status).toBe(204);
      await new TestClient().call(register.POST, { method: 'POST', body: registration('reset') });
      const user = await db().user.findUniqueOrThrow({ where: { username: 'userreset' } });
      await db().passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256('token-de-prueba'), expiresAt: new Date(Date.now() + 60_000) } });
      const body = { token: 'token-de-prueba', password: 'NuevaClave123', confirmPassword: 'NuevaClave123' };
      expect((await new TestClient().call(reset.POST, { method: 'POST', body })).status).toBe(204);
      expect((await new TestClient().call(reset.POST, { method: 'POST', body })).body.code).toBe('AUTH_INVALID_RESET_TOKEN');
      expect((await new TestClient().call(login.POST, { method: 'POST', body: { identifier: 'userreset', password: 'NuevaClave123' } })).status).toBe(200);
    });
  });

  describe('regalos, publicación y reservas', () => {
    let giftId: string;
    let slug: string;
    let publicGiftId: string;

    it('crea un regalo sanitizando y validando cantidades', async () => {
      const res = await parent.call(gifts.POST, { method: 'POST', body: { name: '  Pañales  ', description: 'Etapa 3', categoryId, quantityRequired: 3 } });
      expect(res).toMatchObject({ status: 201, body: { name: 'Pañales', status: 'AVAILABLE', quantityAvailable: 3 } });
      giftId = res.body.id;
      expect((await parent.call(gifts.POST, { method: 'POST', body: { name: 'X', categoryId, quantityRequired: 0 } })).status).toBe(400);
    });

    it('guarda imágenes en la BD validando su firma binaria', async () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 1, 2, 3]);
      const form = new FormData();
      form.append('image', new File([png], 'a.png', { type: 'image/png' }));
      const res = await parent.call(giftImage.POST, { method: 'POST', params: { id: giftId }, form });
      expect(res.body.imageUrl).toMatch(/^\/api\/v1\/images\/[0-9a-f-]{36}$/);
      const imageId = res.body.imageUrl.split('/').pop();
      const served = await new TestClient().call(images.GET, { params: { id: imageId } });
      expect(served.status).toBe(200);
      expect(served.headers.get('content-type')).toBe('image/png');

      const fake = new FormData();
      fake.append('image', new File(['<script>alert(1)</script>'], 'x.png', { type: 'image/png' }));
      expect((await parent.call(giftImage.POST, { method: 'POST', params: { id: giftId }, form: fake })).body.code).toBe('INVALID_IMAGE');
    });

    it('publica con un enlace no predecible que no expone IDs internos', async () => {
      const res = await parent.call(publish.POST, { method: 'POST' });
      slug = res.body.publicSlug;
      expect(slug).toMatch(/^lucia-[a-z0-9]{10}$/);
      const pub = await new TestClient().call(publicShower.GET, { params: { slug } });
      expect(JSON.stringify(pub.body)).not.toContain(giftId);
      expect(pub.body).not.toHaveProperty('id');
      publicGiftId = pub.body.gifts[0].publicId;
    });

    it('serializa reservas concurrentes sin superar la cantidad disponible', async () => {
      const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          new TestClient().call(reserve.POST, {
            method: 'POST',
            params: { slug, giftId: publicGiftId },
            body: { guestName: `Invitado ${i}`, quantity: 1 },
          }),
        ),
      );
      const statuses = results.map((r) => r.status);
      expect(statuses.filter((s) => s === 201)).toHaveLength(3);
      expect(statuses.filter((s) => s === 409)).toHaveLength(3);
      expect(await db().gift.findUniqueOrThrow({ where: { id: giftId } })).toMatchObject({ quantityReserved: 3, status: 'RESERVED' });

      // Agotado: deja de aparecer en la lista pública.
      const pub = await new TestClient().call(publicShower.GET, { params: { slug } });
      expect(pub.body.gifts).toHaveLength(0);
      expect(pub.body.hasFullyReservedGifts).toBe(true);
    });

    it('no permite bajar la cantidad por debajo de lo reservado', async () => {
      const res = await parent.call(gift.PATCH, { method: 'PATCH', params: { id: giftId }, body: { quantityRequired: 2 } });
      expect(res).toMatchObject({ status: 409, body: { code: 'GIFT_QUANTITY_BELOW_RESERVED' } });
    });

    it('permite cancelar y marcar como entregado respetando las transiciones', async () => {
      const list = await parent.call(reservations.GET, { url: `/api/v1/reservations?giftId=${giftId}` });
      expect(list.body).toHaveLength(3);
      const [first, second] = list.body;

      await parent.call(reservationStatus.PATCH, { method: 'PATCH', params: { id: first.id }, body: { status: 'CANCELLED' } });
      expect(await db().gift.findUniqueOrThrow({ where: { id: giftId } })).toMatchObject({ quantityReserved: 2, status: 'PARTIALLY_RESERVED' });

      const invalid = await parent.call(reservationStatus.PATCH, { method: 'PATCH', params: { id: first.id }, body: { status: 'DELIVERED' } });
      expect(invalid.body.code).toBe('RESERVATION_INVALID_TRANSITION');

      await parent.call(reservationStatus.PATCH, { method: 'PATCH', params: { id: second.id }, body: { status: 'DELIVERED' } });
      const delivered = await parent.call(reservations.GET, { url: '/api/v1/reservations?status=DELIVERED' });
      expect(delivered.body).toHaveLength(1);
    });

    it('impide acceder a regalos o reservas de otro usuario', async () => {
      const other = new TestClient();
      await other.call(register.POST, { method: 'POST', body: registration('z') });
      expect((await other.call(gift.PATCH, { method: 'PATCH', params: { id: giftId }, body: { name: 'Hack' } })).status).toBe(404);
      expect((await other.call(reservations.GET)).body).toHaveLength(0);
    });

    it('bloquea el borrado con reservas activas y oculta la página al despublicar', async () => {
      expect((await parent.call(gift.DELETE, { method: 'DELETE', params: { id: giftId } })).body.code).toBe('GIFT_HAS_ACTIVE_RESERVATIONS');
      await parent.call(unpublish.POST, { method: 'POST' });
      expect((await new TestClient().call(publicShower.GET, { params: { slug } })).status).toBe(404);
    });

    it('resume los datos en el dashboard', async () => {
      const res = await parent.call(dashboard.GET);
      expect(res.body.gifts).toMatchObject({ total: 1, partiallyReserved: 1, unitsRequired: 3, unitsReserved: 2 });
      expect(res.body.reservations).toMatchObject({ total: 3, cancelled: 1, delivered: 1, pending: 1 });
    });
  });
});
