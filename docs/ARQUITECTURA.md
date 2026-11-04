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
├── config/load-env.ts       elige el perfil .env.<APP_ENV>
├── prisma.config.ts         carga el perfil activo
└── .env.development · .env.test · .env.production   perfiles locales (no versionados)
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
- `ReservationStatus`: `CONFIRMED` (el invitado confirma al reservar) → `DELIVERED` (los padres lo marcan como entregado) o `CANCELLED` (los padres la cancelan).
- `RecordStatus`: `ACTIVE`/`INACTIVE`, que marca el borrado lógico o la desactivación.

## Reglas de negocio

1. Registrarse crea, en una sola operación, el `User` y su `BabyShower`.
2. Un regalo no se puede reservar por encima de su cantidad disponible (`requerida - reservada`).
3. **Concurrencia:** la reserva corre en una transacción que bloquea la fila del regalo con `SELECT … FOR UPDATE`. Las reservas simultáneas se serializan; está probado con 6 peticiones en paralelo contra un stock de 3.
4. Las reservas confirmadas y entregadas ocupan unidades del regalo; cancelar una reserva confirmada las libera en la misma transacción.
5. Transiciones permitidas: `CONFIRMED → DELIVERED` y `CONFIRMED → CANCELLED`. Ambos son estados finales.
6. No se puede reducir la cantidad requerida por debajo de la ya reservada.
7. No se puede eliminar un regalo con reservas confirmadas aún sin entregar. El borrado es lógico y conserva el historial.
8. Los invitados no necesitan registrarse, solo ven datos públicos (sin IDs internos ni correos) y no pueden modificar la lista. Los regalos agotados no se envían a la página pública.
9. Cada usuario accede únicamente a sus propios regalos y reservas; los de otro usuario devuelven 404.
10. Publicar genera `<nombre-del-bebé>-<10 caracteres aleatorios>`, con unos 50 bits de entropía. Volver a publicar conserva el mismo enlace; ocultar el Baby Shower lo desactiva.

## Seguridad

Auditoría del 2026-11-04: cada medida está cubierta por pruebas automáticas (`apps/web/src/security.test.ts` y `apps/web/test/api.integration.test.ts`) y fue verificada con ataques reales contra la app.

| Medida | Implementación |
|---|---|
| Hash de contraseñas | Argon2id (64 MiB, t=3) y verificación ficticia para igualar tiempos si el usuario no existe |
| Sesiones | JWT de acceso de 15 min (`jose`, HS256, emisor verificado) ligado a una sesión (`sid`) que se comprueba en BD en cada petición. El logout, la rotación o un cambio de contraseña lo invalidan **al instante** |
| Refresh token | Opaco, 7 días, guardado como hash; rotación con actualización condicional. Si se reutiliza uno ya rotado, se cierran todas las sesiones del usuario |
| Cookies | `HttpOnly`; `SameSite=Lax` (acceso) y `Strict` (refresh, limitada a `/api/v1/auth`); `Secure` en producción. Nunca hay tokens en `localStorage` |
| CSRF | Cookies `SameSite`; rechazo de `Sec-Fetch-Site: cross-site` y verificación de `Origin` en toda petición que modifica datos |
| Fuerza bruta | Rate limiting en PostgreSQL **por IP y por cuenta**: login 5/min por IP y 10/15 min por cuenta; recuperación 3/min por IP y 3/h por correo; reservas 10/min por IP y 60/10 min por Baby Shower. Bloqueo de 15 min tras 5 fallos |
| IP del cliente | Se prioriza `x-vercel-forwarded-for` (no falsificable en Vercel) y solo se aceptan IPs válidas. Las claves se guardan como hash de longitud fija |
| Tamaño de peticiones | JSON: máx. 100 KB; imágenes: 2 MB + margen. El límite se aplica al leer el stream, aunque no haya `Content-Length` |
| Validación | Esquemas zod estrictos (`strictObject`: rechazan campos desconocidos) y validación de parámetros de ruta (UUID y slugs) |
| Sanitización / XSS | Recorte de espacios y eliminación de caracteres de control; React escapa todo; sin `dangerouslySetInnerHTML` ni `eval` |
| Content-Security-Policy | `default-src 'self'`; sin recursos de terceros; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` |
| Otras cabeceras | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS y COOP; `x-powered-by` desactivado |
| SQL Injection | Prisma, y consultas crudas solo con plantillas parametrizadas; el nombre de esquema se valida con una expresión regular |
| Redirecciones | `returnUrl` resuelto con `URL` y aceptado solo si es del mismo origen (bloquea `//host` y `/\host`) |
| Imágenes | Firma binaria verificada (JPG, PNG o WEBP), `CHECK` en BD y servidas con `nosniff`, `CSP sandbox` y `CORP same-origin`. Si el Baby Shower no está publicado, solo las ve su dueño |
| Control de acceso | Cada consulta privada filtra por el dueño (`babyShower.userId`); los recursos ajenos responden 404 |
| Errores y logs | Formato `{ statusCode, code, message }` sin stack traces; en producción no se dan detalles de validación; no se registran contraseñas, tokens ni cuerpos |
| Conexión a BD | TLS (`sslmode=require`); con `DATABASE_CA_CERT` también se verifica el certificado, y en producción se avisa si falta |
| Secretos | Perfiles `.env.*` fuera del repositorio; `JWT_ACCESS_SECRET` de al menos 32 caracteres y distinto por perfil |
| Dependencias | Versiones estables fijadas; `npm audit` sin vulnerabilidades |

### Riesgos conocidos y aceptados (MVP)

| Riesgo | Motivo / mitigación |
|---|---|
| `script-src 'unsafe-inline'` en la CSP | Next lo necesita para hidratar sin nonces. Mitigado porque React escapa todo y no hay HTML dinámico. Mejora futura: nonces con `proxy.ts` |
| Bloqueo de cuenta provocado por un tercero (5 intentos fallidos) | Es el precio de frenar la fuerza bruta. Dura 15 min |
| Enumeración de correos en el registro (`AUTH_EMAIL_TAKEN`) | Decisión de usabilidad. La recuperación de contraseña sí responde igual exista o no el correo |
| Sin verificación de correo al registrarse | Fuera del alcance del MVP (no hay proveedor de correo) |
| Reservas falsas de invitados anónimos | Limitadas por IP y por Baby Shower; los padres pueden cancelarlas desde el panel |
| Fuera de Vercel, las cabeceras de IP se pueden falsear si el proxy no las sobrescribe | El límite por cuenta sigue protegiendo. Hay que desplegar detrás de un proxy que fije `x-real-ip` |
