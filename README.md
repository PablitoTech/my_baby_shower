# My Baby Shower

Plataforma web para organizar y gestionar Baby Showers. Los futuros padres crean un evento para su bebé, registran una lista de regalos y la comparten mediante un enlace público, donde los invitados pueden reservar el regalo que llevarán al evento sin necesidad de registrarse.

> **Estado:** MVP completo, migrado a **Next.js full-stack** para desplegarse en **Vercel**. Consulta [`docs/FASES.md`](docs/FASES.md), [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

## Características

- Landing page con diseño pastel, neutro y responsive.
- Registro de padres y bebé, inicio y cierre de sesión, y recuperación de contraseña.
- Dashboard con resumen de regalos y reservas, cuenta regresiva y enlace público.
- Gestión de regalos por categoría, con cantidades, estados e imagen opcional (guardada en PostgreSQL).
- Publicación del Baby Shower con un enlace no predecible y botón de copiar.
- Página pública para invitados, con reserva sin registro. Los regalos agotados dejan de mostrarse.
- Reservas transaccionales que nunca superan la cantidad disponible.
- Administración de reservas: filtros, confirmación, cancelación, entrega e historial.
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
├── .env                         # Variables y credenciales locales (NO versionado)
└── .env.example
```

## Requisitos previos

- Node.js 24 LTS y npm 11
- Una base PostgreSQL: remota (Aiven, Neon, Supabase…) o local con Docker

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env
#    Edita DATABASE_URL y genera un secreto:  openssl rand -base64 48  → JWT_ACCESS_SECRET

# 2. (Opcional) PostgreSQL local con Docker
npm run db:up

# 3. Dependencias (genera también el cliente Prisma)
npm install

# 4. Tablas y categorías iniciales
npm run prisma:deploy
npm run prisma:seed

# 5. Desarrollo
npm run dev            # http://localhost:3000
```

## Base de datos

La conexión se define con una sola variable:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASENA@HOST:PUERTO/BASE_DE_DATOS?sslmode=require&schema=my_baby_shower_dev"
```

- `schema` aísla las tablas del proyecto en su propio esquema de PostgreSQL. Así puede convivir con otras aplicaciones en la misma base, por ejemplo `finance_tracker` en Aiven.
- `sslmode=require` cifra la conexión, algo obligatorio en Aiven. Si además defines `DATABASE_CA_CERT` con el certificado CA del proveedor, también se verifica el certificado del servidor.
- Las variables `DB_*` solo las usa Docker Compose para la base local.

## Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo (UI + API) |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm test` | Pruebas unitarias |
| `npm run test:integration` | Pruebas de integración (crean `my_baby_shower_test` en el PostgreSQL **local**) |
| `npm run prisma:deploy` | Aplica las migraciones pendientes a `DATABASE_URL` |
| `npm run prisma:seed` | Carga las categorías (idempotente) |
| `npm run prisma:migrate` | Crea una migración nueva (desarrollo, interactivo) |
| `npm run prisma:studio` | Abre Prisma Studio |
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
| POST | `/auth/forgot-password` · `/auth/reset-password` | Público | Recuperación de contraseña |
| GET / PATCH | `/baby-shower` | Privado | Consultar o editar el evento |
| GET | `/baby-shower/dashboard` | Privado | Resumen |
| POST | `/baby-shower/publish` · `/unpublish` | Privado | Publicar u ocultar |
| GET | `/categories` | Privado | Categorías |
| GET / POST | `/gifts` | Privado | Listar (filtros `categoryId` y `status`) o crear |
| GET / PATCH / DELETE | `/gifts/:id` | Privado | Consultar, editar o eliminar |
| POST / DELETE | `/gifts/:id/image` | Privado | Subir o quitar la imagen (`multipart`, campo `image`) |
| GET | `/images/:id` | Público | Servir la imagen de un regalo |
| GET | `/reservations` | Privado | Historial (filtros `giftId` y `status`) |
| PATCH | `/reservations/:id/status` | Privado | Confirmar, cancelar o entregar |
| GET | `/public/baby-showers/:slug` | Público | Información pública y regalos disponibles |
| POST | `/public/baby-showers/:slug/gifts/:giftId/reservations` | Público | Reservar |

Los errores tienen la forma `{ statusCode, code, message, details? }`. El frontend traduce `code` con la clave `errors.<code>`.

## Despliegue en Vercel

Resumen (detalle en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)):

1. Importa el repositorio en Vercel y define **Root Directory = `apps/web`**.
2. Variables de entorno: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `APP_URL` y, opcionalmente, `DATABASE_CA_CERT`.
3. Aplica las migraciones a la base remota con `npm run prisma:deploy` y luego `npm run prisma:seed`.
4. Despliega.

## Recuperación de contraseña en desarrollo

El MVP no tiene proveedor de correo. Con `NODE_ENV=development`, el enlace de recuperación aparece en la consola del servidor. En producción no se registra; para enviarlo, integra un proveedor en `apps/web/src/server/mail.ts`.

## Licencia

MIT. Consulta [`LICENSE.md`](LICENSE.md).
