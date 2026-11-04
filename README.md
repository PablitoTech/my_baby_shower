# my_baby_shower

Plataforma web para organizar y gestionar Baby Showers. Los futuros padres crean un evento para su bebé, registran una lista de regalos y la comparten mediante un enlace público, donde los invitados pueden reservar el regalo que llevarán al evento sin necesidad de registrarse.

> **Estado:** MVP completo. Consulta el plan y el estado de cada fase en [`docs/FASES.md`](docs/FASES.md) y las decisiones técnicas en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Características

- Landing page con diseño pastel, neutro y responsive.
- Registro de padres y bebé, inicio y cierre de sesión, y recuperación de contraseña.
- Dashboard con resumen de regalos y reservas, cuenta regresiva y enlace público.
- Gestión de regalos por categoría, con cantidades, estados e imagen opcional.
- Publicación del Baby Shower con un enlace no predecible y botón de copiar.
- Página pública para invitados con filtros y reserva sin registro.
- Reservas transaccionales que nunca superan la cantidad disponible.
- Administración de reservas: filtros, confirmación, cancelación, entrega e historial.
- Interfaz en español (predeterminado) e inglés, y documentación de la API con Swagger.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript 6.0 |
| Frontend | Angular 22 + ngx-translate 18 |
| Backend | NestJS 12 |
| ORM | Prisma 7.10 (adaptador `pg`) |
| Base de datos | PostgreSQL 18 |
| Infraestructura | Docker y Docker Compose |
| Monorepo | npm workspaces (Node.js 24 LTS) |
| Pruebas | Vitest, Supertest, `node:test` |

## Estructura del proyecto

```text
my_baby_shower/
├── apps/
│   ├── frontend/            # Aplicación Angular (angular.json propio)
│   └── backend/             # API NestJS (nest-cli.json propio)
├── libs/
│   ├── common/              # Validaciones, idiomas y códigos de error compartidos
│   ├── contracts/           # Enums y tipos de peticiones/respuestas
│   └── shared/              # Lógica de dominio pura (estados, transiciones)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── infrastructure/docker/
│   ├── docker-compose.yml
│   └── postgres/init/       # Script que crea el esquema configurado
├── docs/                    # Fases, arquitectura e imágenes
├── prisma.config.ts
├── environment.m            # Credenciales locales (NO versionado)
├── .env.example
├── LICENSE.md
└── README.md
```

## Requisitos previos

- Node.js 24 LTS y npm 11
- Docker y Docker Compose

```bash
node -v && npm -v && docker -v && docker compose version
```

## Puesta en marcha

```bash
# 1. Configurar el entorno (y generar un secreto JWT propio)
cp .env.example environment.m
openssl rand -base64 48   # pega el resultado en JWT_ACCESS_SECRET

# 2. Levantar PostgreSQL
npm run db:up
npm run db:status          # debe mostrar "healthy"

# 3. Instalar dependencias (compila las libs y genera el cliente Prisma)
npm install

# 4. Crear las tablas y cargar las categorías
npm run prisma:deploy
npm run prisma:seed

# 5. Arrancar backend y frontend
npm run dev
```

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:4200 |
| API | http://localhost:3000/api |
| Documentación de la API (Swagger, solo fuera de producción) | http://localhost:3000/api/docs |
| Estado de la API | http://localhost:3000/api/health |

En desarrollo, el servidor de Angular redirige `/api` y `/uploads` al backend (`apps/frontend/proxy.conf.json`). Así las cookies de sesión son del mismo origen.

## Configuración del entorno

`environment.m` usa formato `.env` y lo leen Prisma (`prisma.config.ts`), Docker Compose (`--env-file`) y NestJS.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_HOST` / `DB_PORT` | Host y puerto **del host** donde se expone PostgreSQL | `localhost` / `5432` |
| `DB_USER` / `DB_PASSWORD` | Credenciales | `polcrez` / `12345` |
| `DB_NAME` / `DB_SCHEMA` | Base de datos y esquema | `my_baby_shower` / `public` |
| `DATABASE_URL` | Cadena de conexión de Prisma (debe coincidir con lo anterior) | `postgresql://polcrez:12345@localhost:5432/my_baby_shower?schema=public` |
| `NODE_ENV` | `development`, `production` o `test` | `development` |
| `API_PORT` | Puerto de la API | `3000` |
| `FRONTEND_URL` | Origen permitido por CORS (o lista separada por comas) | `http://localhost:4200` |
| `JWT_ACCESS_SECRET` | Secreto de firma (mínimo 32 caracteres) | *aleatorio* |
| `JWT_ACCESS_TTL` | Duración del token de acceso | `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Duración de la sesión | `7` |
| `PASSWORD_RESET_TTL_MINUTES` | Validez del enlace de recuperación | `30` |

> ⚠️ Las credenciales de ejemplo son **exclusivamente para desarrollo local**. `environment.m` está en `.gitignore`.

> 💡 **Puerto 5432 ocupado:** si ya tienes un PostgreSQL instalado en tu equipo, cambia `DB_PORT` (por ejemplo, a `5433`) y el puerto de `DATABASE_URL` en `environment.m`. El contenedor seguirá escuchando en el 5432 por dentro.

## Comandos

### Base de datos (Docker)

| Comando | Acción |
|---|---|
| `npm run db:up` | Inicia PostgreSQL en segundo plano |
| `npm run db:status` | Muestra el estado del contenedor y del healthcheck |
| `npm run db:logs` | Sigue los logs de PostgreSQL |
| `npm run db:psql` | Abre una consola `psql` dentro del contenedor |
| `npm run db:down` | Detiene el contenedor (**los datos se conservan**) |
| `npm run db:destroy` | Detiene el contenedor y **borra el volumen de datos** |

Equivalente sin npm:

```bash
docker compose -f infrastructure/docker/docker-compose.yml --env-file environment.m up -d
docker compose -f infrastructure/docker/docker-compose.yml --env-file environment.m down
```

### Prisma

| Comando | Acción |
|---|---|
| `npm run prisma:generate` | Regenera el cliente |
| `npm run prisma:migrate` | Crea y aplica una migración (desarrollo) |
| `npm run prisma:deploy` | Aplica las migraciones pendientes |
| `npm run prisma:seed` | Carga las categorías iniciales (idempotente) |
| `npm run prisma:studio` | Abre Prisma Studio |

### Desarrollo, build y calidad

| Comando | Acción |
|---|---|
| `npm run dev` | Backend y frontend en modo desarrollo |
| `npm run dev:backend` / `npm run dev:frontend` | Solo uno de los dos |
| `npm run build` | Compila libs, backend y frontend (producción) |
| `npm test` | Pruebas unitarias de libs, backend y frontend |
| `npm run test:e2e` | Pruebas de integración contra PostgreSQL real (crea `my_baby_shower_test`) |
| `npm run audit` | Revisa vulnerabilidades de dependencias de producción |

## API

Todas las rutas llevan el prefijo `/api`. Las privadas requieren la cookie de sesión.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Público | Crea la cuenta y el Baby Shower |
| POST | `/auth/login` | Público | Inicia sesión con correo o usuario |
| POST | `/auth/refresh` | Cookie | Rota la sesión |
| POST | `/auth/logout` | Cookie | Cierra la sesión |
| GET | `/auth/me` | Privado | Usuario actual |
| POST | `/auth/forgot-password` | Público | Solicita el enlace de recuperación |
| POST | `/auth/reset-password` | Público | Cambia la contraseña con el token |
| GET / PATCH | `/baby-shower` | Privado | Consulta o edita el evento |
| GET | `/baby-shower/dashboard` | Privado | Resumen del dashboard |
| POST | `/baby-shower/publish` · `/unpublish` | Privado | Publica u oculta el Baby Shower |
| GET | `/categories` | Privado | Categorías |
| GET / POST | `/gifts` | Privado | Lista (filtros `categoryId` y `status`) o crea regalos |
| GET / PATCH / DELETE | `/gifts/:id` | Privado | Consulta, edita o elimina un regalo |
| POST / DELETE | `/gifts/:id/image` | Privado | Sube o quita la imagen (`multipart`, campo `image`) |
| GET | `/reservations` | Privado | Historial (filtros `giftId` y `status`) |
| PATCH | `/reservations/:id/status` | Privado | Confirma, cancela o marca como entregada |
| GET | `/public/baby-showers/:slug` | Público | Información pública y regalos |
| POST | `/public/baby-showers/:slug/gifts/:giftId/reservations` | Público | Reserva un regalo |

Los errores siempre tienen la forma `{ statusCode, code, message, details? }`. El frontend traduce `code` con la clave `errors.<code>`.

## Recuperación de contraseña en desarrollo

El MVP no incluye un proveedor de correo. Con `NODE_ENV=development`, el enlace de recuperación aparece en la **consola del backend**. En producción no se registra, y para enviarlo hay que integrar un proveedor SMTP en `apps/backend/src/auth/mail.service.ts`.

## Internacionalización

- Archivos: `apps/frontend/src/assets/i18n/es.json` y `en.json`, que tienen las mismas claves (lo comprueba una prueba).
- El idioma predeterminado es español. El selector ES/EN está en la cabecera y la preferencia se recuerda entre visitas.
- Para agregar un idioma: crea `<código>.json` y añade el código a `SUPPORTED_LANGUAGES` en `libs/common/src/i18n.ts`.

## Producción (lineamientos)

- `NODE_ENV=production`: activa cookies `Secure`, desactiva Swagger y oculta los mensajes de validación detallados.
- Usa credenciales y `JWT_ACCESS_SECRET` propios, nunca los de ejemplo.
- Sirve frontend y API bajo el mismo dominio (o configura `FRONTEND_URL`) detrás de HTTPS.
- Ejecuta `npm run prisma:deploy` en cada despliegue.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [`LICENSE.md`](LICENSE.md).
