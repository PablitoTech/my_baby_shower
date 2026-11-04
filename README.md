# My Baby Shower

Plataforma web para organizar y gestionar Baby Showers. Los futuros padres crean un evento para su bebé, registran una lista de regalos y la comparten mediante un enlace público, donde los invitados pueden reservar el regalo que llevarán al evento sin necesidad de registrarse.

> **Estado:** MVP completo, migrado a **Next.js full-stack** para desplegarse en **Vercel**. Consulta [`docs/FASES.md`](docs/FASES.md), [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

## Características

- Landing page con diseño pastel, neutro y responsive.
- Registro de padres y bebé, e inicio y cierre de sesión.
- Dashboard con resumen de regalos y reservas, cuenta regresiva y enlace público.
- Gestión de regalos por categoría, con cantidades, estados e imagen opcional (guardada en PostgreSQL).
- Publicación del Baby Shower con un enlace no predecible y botón de copiar.
- Página pública para invitados, con reserva sin registro. Los regalos agotados dejan de mostrarse.
- Reservas transaccionales que nunca superan la cantidad disponible.
- Administración de reservas: el invitado confirma al reservar y los padres marcan el regalo como entregado o cancelan la reserva; filtros e historial.
- Interfaz en español (predeterminado) e inglés.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript 6.0 |
| Aplicación (UI + API) | Next.js 16 (App Router, route handlers) y React 19 |
| Formularios y validación | react-hook-form + zod (los mismos esquemas en cliente y servidor) |
| i18n | i18next + react-i18next |
| ORM | Prisma 7.10 (adaptador `pg`) |
| Base de datos | PostgreSQL (Aiven en la nube o Docker en local) |
| Autenticación | Argon2id, JWT (`jose`) en cookies HttpOnly y refresh rotativo |
| Monorepo | npm workspaces (Node.js 24 LTS) |
| Pruebas | Vitest, Testing Library |
| Despliegue | Vercel |

## Estructura del proyecto

```text
my_baby_shower/
├── apps/
│   └── web/                     # Next.js full-stack (se despliega en Vercel)
│       ├── src/app/             # Rutas: (public), (app) y api/v1 (route handlers)
│       ├── src/server/          # Lógica de servidor: servicios, auth, BD, rate limit
│       ├── src/client/          # Interfaz: componentes, páginas, contexto, API
│       ├── src/shared/          # Esquemas zod compartidos cliente/servidor
│       ├── src/i18n/locales/    # es.json, en.json
│       ├── src/styles/          # SCSS (sistema de diseño)
│       ├── test/                # Pruebas de integración (PostgreSQL real)
│       └── vercel.json
├── libs/
│   ├── common/                  # Validaciones, idiomas y códigos de error
│   ├── contracts/               # Enums y tipos de la API
│   └── shared/                  # Lógica de dominio pura (estados, transiciones)
├── prisma/                      # schema.prisma, migraciones y seed
├── infrastructure/docker/       # PostgreSQL local opcional
├── docs/
├── prisma.config.ts
├── .env.development / .env.test / .env.production   # Perfiles locales (NO versionados)
├── config/load-env.ts           # Selección de perfil (APP_ENV)
└── .env.example
```

## Requisitos previos

- Node.js 24 LTS y npm 11
- Una base PostgreSQL: remota (Aiven, Neon, Supabase…) o local con Docker

## Puesta en marcha

```bash
# 1. Perfiles de variables
cp .env.example .env.development   # PostgreSQL local:  .../my_baby_shower?schema=public  (+ variables DB_*)
cp .env.example .env.test          # PostgreSQL local:  .../my_baby_shower_test?schema=public (+ RATE_LIMIT_DISABLED=true)
cp .env.example .env.production    # Aiven:  ...?schema=my_baby_shower&sslmode=require
#    En cada uno: DATABASE_URL y un JWT_ACCESS_SECRET propio (openssl rand -base64 48)

# 2. PostgreSQL local y dependencias (genera también el cliente Prisma)
npm run db:up
npm install

# 3. Tablas y categorías en cada esquema
npm run prisma:deploy        && npm run prisma:seed        # dev
npm run prisma:deploy:test   && npm run prisma:seed:test   # test
npm run prisma:deploy:prod   && npm run prisma:seed:prod   # prod

# 4. Desarrollo (perfil dev)
npm run dev            # http://localhost:3000
```

## Perfiles de entorno

| Perfil | Archivo | Esquema | Lo usan |
|---|---|---|---|
| dev | `.env.development` | PostgreSQL local (Docker) `my_baby_shower` | `npm run dev` y los comandos de Prisma sin sufijo |
| test | `.env.test` | PostgreSQL local (Docker) `my_baby_shower_test` | `npm run test:integration` y los comandos `:test` |
| prod | `.env.production` | Aiven, esquema `my_baby_shower` | `npm run build` / `start` y los comandos `:prod` |

El perfil se elige con `APP_ENV`; si no se define, se deduce de `NODE_ENV` (ver `config/load-env.ts`). Las pruebas de integración **borran datos** y se niegan a correr si la base o el esquema no terminan en `_test`. En Vercel no se usan archivos: las variables se definen en el panel.

## Base de datos

La conexión se define con una sola variable:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASENA@HOST:PUERTO/BASE_DE_DATOS?sslmode=require&schema=my_baby_shower_dev"
```

- `schema` aísla las tablas del proyecto en su propio esquema de PostgreSQL. Así puede convivir con otras aplicaciones en la misma base, por ejemplo `finance_tracker` en Aiven.
- `sslmode=require` cifra la conexión, algo obligatorio en Aiven. Si además defines `DATABASE_CA_CERT` con el certificado CA del proveedor, también se verifica el certificado del servidor.
- Las variables `DB_*` (solo en `.env.development`) las usa Docker Compose para la base local opcional.

## Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo (UI + API) |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm test` | Pruebas unitarias |
| `npm run test:integration` | Pruebas de integración contra el perfil test (`my_baby_shower_test`) |
| `npm run prisma:deploy` · `:test` · `:prod` | Aplica las migraciones pendientes al perfil |
| `npm run prisma:seed` · `:test` · `:prod` | Carga las categorías (idempotente) |
| `npm run prisma:status` · `:prod` | Estado de las migraciones |
| `npm run prisma:migrate` | Crea una migración nueva (desarrollo, interactivo) |
| `npm run prisma:studio` · `:prod` | Abre Prisma Studio |
| `npm run db:up` / `db:down` / `db:status` / `db:logs` / `db:psql` | PostgreSQL local con Docker |
| `npm run db:destroy` | Elimina el contenedor y **borra los datos locales** |
| `npm run audit` | Revisa vulnerabilidades |

## API (`/api/v1`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado de la API y de la BD |
| POST | `/auth/register` · `/auth/login` | Público | Registro (crea el Baby Shower) e inicio de sesión |
| POST | `/auth/refresh` · `/auth/logout` | Cookie | Rotar o cerrar la sesión |
| GET | `/auth/me` | Privado | Usuario actual |
| GET / PATCH | `/baby-shower` | Privado | Consultar o editar el evento |
| GET | `/baby-shower/dashboard` | Privado | Resumen |
| POST | `/baby-shower/publish` · `/unpublish` | Privado | Publicar u ocultar |
| GET | `/categories` | Privado | Categorías |
| GET / POST | `/gifts` | Privado | Listar (filtros `categoryId` y `status`) o crear |
| GET / PATCH / DELETE | `/gifts/:id` | Privado | Consultar, editar o eliminar |
| POST / DELETE | `/gifts/:id/image` | Privado | Subir o quitar la imagen (`multipart`, campo `image`) |
| GET | `/images/:id` | Público | Servir la imagen de un regalo |
| GET | `/reservations` | Privado | Historial (filtros `giftId` y `status`) |
| PATCH | `/reservations/:id/status` | Privado | Marcar como entregada o cancelar (`{ "status": "DELIVERED" \| "CANCELLED" }`) |
| GET | `/public/baby-showers/:slug` | Público | Información pública y regalos disponibles |
| POST | `/public/baby-showers/:slug/gifts/:giftId/reservations` | Público | Reservar |

Los errores tienen la forma `{ statusCode, code, message, details? }`. El frontend traduce `code` con la clave `errors.<code>`.

## Despliegue en Vercel

Resumen (detalle en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)):

1. Importa el repositorio en Vercel y define **Root Directory = `apps/web`**.
2. Variables de entorno: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `APP_URL` y, opcionalmente, `DATABASE_CA_CERT`.
3. Aplica las migraciones a la base remota con `npm run prisma:deploy` y luego `npm run prisma:seed`.
4. Despliega.

## Recuperación de contraseña

No está disponible: requiere un proveedor de correo (Resend o SMTP) y por ahora no hay ninguno. La implementación completa (enlace de un solo uso, correo con la marca, envío por Resend o SMTP) está en el historial de git y puede restaurarse cuando haya un proveedor.

## Licencia

MIT. Consulta [`LICENSE.md`](LICENSE.md).
