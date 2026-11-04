# Arquitectura de My Baby Shower

Este documento recoge las versiones, la arquitectura del monorepo, el modelo de datos, las reglas de negocio y las medidas de seguridad. Desde la Fase 13, la aplicación es un **Next.js full-stack** desplegable en Vercel; la versión anterior (Angular + NestJS) se conserva en el primer commit del repositorio.

## Versiones seleccionadas (noviembre de 2026)

| Tecnología | Versión | Notas |
|---|---|---|
| Node.js | 24 LTS | `engines.node >= 24` |
| npm | 11 | Workspaces nativos |
| TypeScript | 6.0.x | |
| Next.js | 16.4 | App Router; la API vive en route handlers (`src/app/api/v1`) |
| React | 19.3 | |
| react-hook-form + zod | 7.91 / 4.6 | Mismos esquemas en formularios y API |
| i18next / react-i18next | 26 / 17 | |
| jose | 6.2 | JWT HS256 |
| Prisma ORM | 7.10.1 | Última **estable** (la etiqueta `latest` de npm apunta a `8.0.0-rc`) |
| PostgreSQL | 18 (local) / Aiven (nube) | |
| Argon2 | 0.45 (Argon2id) | Hash de contraseñas |

## Monorepo

```text
my_baby_shower/
├── apps/
│   └── web/                       Next.js full-stack (Vercel)
│       └── src/
│           ├── app/
│           │   ├── (public)/          landing, login, registro, recuperación, página pública
│           │   ├── (app)/             dashboard, regalos, reservas, evento (requieren sesión)
│           │   └── api/v1/            route handlers de la API
│           ├── server/                solo servidor
│           │   ├── services/          lógica de negocio (auth, baby shower, regalos, reservas…)
│           │   ├── auth/              JWT, cookies, Argon2id, sesión
│           │   ├── db/                PrismaClient (adaptador pg, SSL, search_path)
│           │   ├── http/              wrapper de rutas, errores, validación, verificación de origen
│           │   └── rate-limit.ts      rate limiting persistido en BD
│           ├── client/                interfaz React (features, ui, layouts, contexto)
│           ├── shared/                esquemas zod compartidos
│           ├── i18n/locales/          es.json, en.json
│           ├── styles/                SCSS del sistema de diseño
│           └── generated/             cliente Prisma (no versionado)
├── libs/
│   ├── common/     constantes de validación, idiomas y códigos de error
│   ├── contracts/  enums e interfaces de peticiones y respuestas
│   └── shared/     lógica de dominio pura (estados, transiciones, slug)
├── prisma/         schema.prisma, migraciones y seed
├── infrastructure/docker/   PostgreSQL local opcional
├── prisma.config.ts         lee .env
└── .env                     variables y credenciales locales (no versionado)
```

- Las librerías de `libs/` se publican como TypeScript (`exports: ./src/index.ts`) y Next las compila con `transpilePackages`, sin paso de build previo.
- La separación `server/` / `client/` mantiene la lógica de negocio fuera del bundle del navegador: los route handlers solo importan `server/`, y las páginas solo `client/`.

## Modelo de datos

```text
User 1 ── 1 BabyShower 1 ── * Gift * ── 1 Category
  │                              ├── 0..1 GiftImage
  ├── * Session                  └── * GiftReservation
  └── * PasswordResetToken
```

| Modelo | Propósito | Puntos clave |
|---|---|---|
| `User` | Cuenta de los padres | `email` y `username` únicos en minúsculas (`CHECK`), `passwordHash` Argon2id, bloqueo por intentos fallidos |
| `Session` | Refresh token rotativo | Solo se guarda el hash SHA-256, con expiración y revocación |
| `PasswordResetToken` | Recuperación de contraseña | Hash SHA-256, un solo uso, expira a los 30 minutos |
| `BabyShower` | Evento | Uno por usuario; `publicSlug` único y no predecible; `CHECK` publicado ⇒ slug |
| `GiftImage` | Imagen de un regalo | `BYTEA` de 2 MB como máximo (`CHECK`) y tipo JPG, PNG o WEBP (`CHECK`); compatible con el disco efímero de serverless |
| `RateLimit` | Rate limiting | Contador por clave con ventana fija, compartido entre instancias |
| `Category` | Catálogo | `code` traducido en el frontend (`categories.<CODE>`) |
| `Gift` | Regalo | `publicId` opaco para la página pública; `CHECK 1 ≤ requerida ≤ 999` y `0 ≤ reservada ≤ requerida`; borrado lógico |
| `GiftReservation` | Reserva | `confirmationCode` único, estado y fechas de cada transición |

Todos los modelos usan UUID v7 como clave primaria, campos de auditoría (`created_at` y `updated_at`), claves foráneas con `ON DELETE` explícito e índices en las columnas de filtrado.

**Estados**
- `GiftStatus`: `AVAILABLE` → `PARTIALLY_RESERVED` → `RESERVED`, calculado con `computeGiftStatus()`.
- `ReservationStatus`: `PENDING`, `CONFIRMED`, `CANCELLED`, `DELIVERED`.
- `RecordStatus`: `ACTIVE`/`INACTIVE`, que marca el borrado lógico o la desactivación.

## Reglas de negocio

1. Registrarse crea, en una sola operación, el `User` y su `BabyShower`.
2. Un regalo no se puede reservar por encima de su cantidad disponible (`requerida - reservada`).
3. **Concurrencia:** la reserva corre en una transacción que bloquea la fila del regalo con `SELECT … FOR UPDATE`. Las reservas simultáneas se serializan; está probado con 6 peticiones en paralelo contra un stock de 3.
4. Las reservas `PENDING`, `CONFIRMED` y `DELIVERED` comprometen unidades. Al pasar a `CANCELLED`, se liberan en la misma transacción.
5. Transiciones permitidas: `PENDING → CONFIRMED | CANCELLED | DELIVERED` y `CONFIRMED → CANCELLED | DELIVERED`. `CANCELLED` y `DELIVERED` son estados finales.
6. No se puede reducir la cantidad requerida por debajo de la ya reservada.
7. No se puede eliminar un regalo con reservas `PENDING` o `CONFIRMED`. El borrado es lógico y conserva el historial.
8. Los invitados no necesitan registrarse, solo ven datos públicos (sin IDs internos ni correos) y no pueden modificar la lista. Los regalos agotados no se envían a la página pública.
9. Cada usuario accede únicamente a sus propios regalos y reservas; los de otro usuario devuelven 404.
10. Publicar genera `<nombre-del-bebé>-<10 caracteres aleatorios>`, con unos 50 bits de entropía. Volver a publicar conserva el mismo enlace; ocultar el Baby Shower lo desactiva.

## Seguridad

| Medida | Implementación |
|---|---|
| Hash de contraseñas | Argon2id (64 MiB, t=3) y verificación ficticia para igualar tiempos si el usuario no existe |
| Sesiones | JWT de acceso de 15 min (`jose`, HS256, emisor verificado) y refresh opaco de 7 días, ambos en cookies `HttpOnly`, con `SameSite` (`Lax`/`Strict`) y `Secure` en producción. Nunca se usa `localStorage` para tokens |
| Rotación de refresh | Cada uso revoca el token anterior con una actualización condicional; si se reutiliza uno revocado, se cierran todas las sesiones |
| CSRF | Cookies `SameSite` y verificación de `Origin` en toda petición que modifica datos (403 si el origen es otro) |
| Fuerza bruta | Rate limiting en PostgreSQL: 5/min en login y registro, 3/min en recuperación, 10/min en reservas públicas. Bloqueo de 15 min tras 5 fallos |
| Validación | Esquemas zod estrictos (`strictObject`: rechazan campos desconocidos) y validación de parámetros de ruta (UUID y slugs) |
| Sanitización | Recorte de espacios y eliminación de caracteres de control; React escapa todo el contenido renderizado |
| SQL Injection | Prisma, y consultas crudas solo con plantillas parametrizadas; el nombre de esquema se valida con una expresión regular |
| Cabeceras | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS y COOP; `x-powered-by` desactivado |
| Errores | Wrapper común con formato `{ statusCode, code, message }`; nunca expone stack traces y en producción omite los detalles de validación |
| Logs | No se registran contraseñas, tokens ni cuerpos de peticiones |
| Imágenes | Máximo 2 MB, firma binaria verificada, `CHECK` en BD, servidas con `nosniff` y `Content-Security-Policy: default-src 'none'; sandbox` |
| Conexión a BD | TLS (`sslmode=require`) y verificación de certificado con `DATABASE_CA_CERT` |
| Redirecciones | `returnUrl` del login limitado a rutas internas |
| Dependencias | Versiones estables fijadas; `npm audit` sin vulnerabilidades |
