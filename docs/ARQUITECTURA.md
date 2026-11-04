# Arquitectura de my_baby_shower

Este documento recoge las decisiones de la Fase 0: las versiones, la arquitectura del monorepo, el modelo de datos y las reglas de negocio.

## Versiones seleccionadas (noviembre de 2026)

| Tecnología | Versión | Notas |
|---|---|---|
| Node.js | 24 LTS | `engines.node >= 24` |
| npm | 11 | Workspaces nativos |
| TypeScript | 6.0.x | Rango que exige Angular 22 (`>=6.0 <6.1`) |
| Angular | 22.2 | Componentes standalone, signals, sin zone.js, OnPush por defecto |
| @ngx-translate | 18.1 | i18n en tiempo de ejecución con archivos JSON |
| NestJS | 12.3 | ESM, Vitest |
| Prisma ORM | 7.10.1 | Última **estable**. La etiqueta `latest` de npm apunta a `8.0.0-rc`, así que se descartó |
| PostgreSQL | 18.6 (alpine) | Imagen oficial |
| Argon2 | 0.45 (Argon2id) | Hash de contraseñas |

## Monorepo

```text
my_baby_shower/
├── apps/
│   ├── backend/            API NestJS (ESM)
│   │   ├── src/
│   │   │   ├── auth/           registro, login, refresh, logout, recuperación
│   │   │   ├── baby-shower/    evento, dashboard, publicación
│   │   │   ├── categories/     catálogo de categorías
│   │   │   ├── gifts/          CRUD de regalos e imágenes
│   │   │   ├── public/         página pública y reservas de invitados
│   │   │   ├── reservations/   administración de reservas
│   │   │   ├── common/         guards, filtros, decoradores, utilidades
│   │   │   ├── config/         validación de variables de entorno
│   │   │   ├── prisma/         PrismaService (adaptador pg)
│   │   │   └── generated/      cliente Prisma generado (no versionado)
│   │   └── test/           pruebas de integración (BD real)
│   └── frontend/           Angular 22
│       └── src/
│           ├── app/core/       API, sesión, interceptor, guards, i18n, toasts
│           ├── app/shared/     componentes, directivas y validadores reutilizables
│           ├── app/layout/     layout público y layout privado
│           ├── app/features/   landing, auth, dashboard, regalos, reservas, evento, público
│           └── assets/i18n/    es.json, en.json
├── libs/
│   ├── common/     constantes de validación, idiomas y códigos de error
│   ├── contracts/  enums e interfaces de peticiones y respuestas
│   └── shared/     lógica de dominio pura (estados, transiciones, slug)
├── prisma/         schema.prisma, migraciones y seed
├── infrastructure/docker/   docker-compose.yml + script de inicialización
├── prisma.config.ts         lee environment.m
└── environment.m            credenciales locales (no versionado)
```

**Ajustes respecto a la estructura propuesta:**
- `angular.json` y `nest-cli.json` viven dentro de cada app (`apps/frontend`, `apps/backend`). Es la práctica recomendada con npm workspaces: cada app conserva su propio CLI y su propia configuración.
- Las librerías de `libs/` se compilan con `tsc -b` a ESM y las consumen ambas apps como paquetes `@mbs/*`. Así el frontend y el backend comparten las mismas reglas de validación, los estados y los códigos de error.

## Modelo de datos

```text
User 1 ── 1 BabyShower 1 ── * Gift * ── 1 Category
  │                              │
  ├── * Session                  └── * GiftReservation
  └── * PasswordResetToken
```

| Modelo | Propósito | Puntos clave |
|---|---|---|
| `User` | Cuenta de los padres | `email` y `username` únicos en minúsculas (`CHECK`), `passwordHash` Argon2id, bloqueo por intentos fallidos |
| `Session` | Refresh token rotativo | Solo se guarda el hash SHA-256, con expiración y revocación |
| `PasswordResetToken` | Recuperación de contraseña | Hash SHA-256, un solo uso, expira a los 30 minutos |
| `BabyShower` | Evento | Uno por usuario; `publicSlug` único y no predecible; `CHECK` publicado ⇒ slug |
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
8. Los invitados no necesitan registrarse, solo ven datos públicos (sin IDs internos ni correos) y no pueden modificar la lista.
9. Cada usuario accede únicamente a sus propios regalos y reservas; los de otro usuario devuelven 404.
10. Publicar genera `<nombre-del-bebé>-<10 caracteres aleatorios>`, con unos 50 bits de entropía. Volver a publicar conserva el mismo enlace; ocultar el Baby Shower lo desactiva.

## Seguridad

| Medida | Implementación |
|---|---|
| Hash de contraseñas | Argon2id (64 MiB, t=3) y verificación ficticia para igualar tiempos si el usuario no existe |
| Sesiones | JWT de acceso de 15 min y refresh opaco de 7 días, ambos en cookies `HttpOnly`, con `SameSite` (`Lax`/`Strict`) y `Secure` en producción. Nunca se usa `localStorage` para tokens |
| Rotación de refresh | Cada uso revoca el token anterior; si se reutiliza uno revocado, se cierran todas las sesiones |
| Fuerza bruta | Rate limiting (`@nestjs/throttler`): 5/min en login y registro, 3/min en recuperación, 10/min en reservas públicas. Bloqueo de 15 min tras 5 fallos |
| Validación | `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`, más DTOs con `class-validator` |
| Sanitización | Recorte de espacios y eliminación de caracteres de control; Angular escapa todo el contenido renderizado |
| SQL Injection | Prisma, y consultas crudas solo mediante plantillas parametrizadas (`$queryRaw\`…${valor}\``) |
| Cabeceras | Helmet (CSP, `X-Frame-Options`, etc.); `x-powered-by` desactivado |
| CORS | Solo `FRONTEND_URL`, con credenciales |
| Errores | Filtro global con un formato `{ statusCode, code, message }`; nunca expone stack traces |
| Logs | No se registran contraseñas, tokens ni cuerpos de peticiones |
| Subida de imágenes | Máximo 2 MB, firma binaria verificada (JPG, PNG o WEBP), nombre aleatorio, `nosniff` y protección contra path traversal |
| Redirecciones | `returnUrl` del login limitado a rutas internas |
| Dependencias | Versiones estables fijadas; `npm audit` sin vulnerabilidades (con un override de `minimatch` para `@nestjs/cli`) |
