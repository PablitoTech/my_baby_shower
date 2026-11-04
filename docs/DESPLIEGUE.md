# Despliegue en Vercel

My Baby Shower es una única aplicación Next.js (`apps/web`) que contiene la interfaz y la API. Se despliega como **un solo proyecto de Vercel**, sin servidores adicionales.

## 1. Base de datos (Aiven u otro PostgreSQL gestionado)

La aplicación usa su propio esquema (`my_baby_shower_dev`, `my_baby_shower_prod`…). Así puede compartir base con otros proyectos sin mezclar tablas ni historial de migraciones.

```env
DATABASE_URL="postgresql://avnadmin:CONTRASENA@HOST.aivencloud.com:PUERTO/finance_tracker?sslmode=require&schema=my_baby_shower_dev"
```

> ⚠️ No uses el esquema de otro proyecto (por ejemplo `finance_mgmt_dev`): `prisma migrate deploy` crearía sus tablas y su tabla `_prisma_migrations` dentro de ese esquema.

### Migraciones

**Automáticas en Vercel (recomendado).** `apps/web/vercel.json` usa `npm run vercel-build`, que ejecuta `scripts/vercel-migrate.mjs` antes de compilar:

| Entorno de Vercel | ¿Migra? |
|---|---|
| Production (rama principal) | Sí: `prisma migrate deploy` + seed idempotente |
| Preview (otras ramas y PRs) | No, para que una rama nunca toque la base de producción |

- `migrate deploy` solo aplica las migraciones pendientes de `prisma/migrations`; nunca borra ni resetea la base.
- Si una migración falla, el build falla y Vercel mantiene el despliegue anterior en línea.
- Para que una Preview migre su propia base, define en ese entorno un `DATABASE_URL` distinto y `RUN_MIGRATIONS=true`.

**Manual (alternativa)**, desde tu equipo con `.env.production`:

```bash
npm run prisma:status:prod    # ver pendientes
npm run prisma:deploy:prod
npm run prisma:seed:prod
```

> 💡 Durante unos segundos, la versión anterior sigue atendiendo mientras se construye la nueva sobre la base ya migrada. Prefiere migraciones compatibles hacia atrás (agregar columnas o valores antes de quitarlos) cuando haya usuarios reales.

### Certificado SSL (recomendado)

Aiven firma sus certificados con su propia CA. Sin el CA, la conexión **se cifra igual**, pero no se verifica la identidad del servidor. Para verificarla:

1. En la consola de Aiven, descarga **CA certificate** (`ca.pem`).
2. Conviértelo a una sola línea: `awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ca.pem`
3. Guárdalo en la variable `DATABASE_CA_CERT`.

## 2. Proyecto en Vercel

1. **Add New → Project** e importa el repositorio.
2. **Root Directory:** `apps/web`. Vercel detecta Next.js y aplica `apps/web/vercel.json`: instala desde la raíz del monorepo, aplica las migraciones (solo en Production), ejecuta `prisma generate` y `next build`.
3. **Environment Variables:**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Cadena de conexión con `sslmode=require&schema=...`. Márcala **solo para Production** (o usa otra base en Preview) |
| `JWT_ACCESS_SECRET` | Secreto aleatorio de al menos 32 caracteres (`openssl rand -base64 48`) |
| `APP_URL` | `https://tu-proyecto.vercel.app` o tu dominio |
| `DATABASE_CA_CERT` | *(opcional)* CA en PEM con `\n` |
| `DATABASE_POOL_MAX` | *(opcional)* conexiones por instancia; `3` funciona bien en serverless |

4. **Deploy.**

> Si en Aiven restringiste las IPs permitidas (*Allowed IP addresses*), el build y las funciones de Vercel necesitan acceso: Vercel no tiene IPs fijas en los planes estándar, así que deja `0.0.0.0/0` (la conexión va cifrada y con contraseña) o usa el *Secure Compute* de Vercel.

## 3. Verificación

- En el log del build debe aparecer `[migrate] Base de datos lista.`

- `https://tu-dominio/api/v1/health` debe responder `{"status":"ok","database":"up"}`.
- Registra una cuenta, agrega un regalo, publica y abre el enlace público en otra ventana.

## Qué cambió para que funcione en serverless

| Aspecto | Solución |
|---|---|
| Disco efímero | Las imágenes se guardan en PostgreSQL (`gift_images`, máximo 2 MB) y se sirven desde `/api/v1/images/:id` con caché inmutable |
| Varias instancias | El rate limiting usa la tabla `rate_limits` con un upsert atómico, no la memoria |
| Conexiones | Un pool pequeño por instancia, reutilizado entre invocaciones |
| Cookies | Frontend y API comparten dominio, así que las cookies `HttpOnly`/`SameSite` funcionan sin CORS |
| Módulo nativo | `argon2` se declara en `serverExternalPackages` y Vercel incluye el binario de Linux |
