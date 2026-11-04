# Fases del proyecto My Baby Shower

Este documento describe el plan de desarrollo incremental de **my_baby_shower**, basado en la especificación de [`prompt.md`](../prompt.md). Cada fase define su objetivo, las tareas, los entregables y los criterios de aceptación necesarios para darla por terminada.

> **Regla de avance:** no se inicia una fase hasta que la anterior cumpla sus criterios de aceptación. En particular, no se implementa el frontend ni el backend completos hasta que la infraestructura de la Fase 1 funcione correctamente.

## Resumen

| Fase | Nombre | Estado |
|---|---|---|
| 0 | Preparación y definiciones | Completada |
| 1 | Infraestructura de desarrollo (Docker + PostgreSQL) | Completada |
| 2 | Base de datos y Prisma | Completada |
| 3 | Backend base (NestJS) y seguridad | Completada |
| 4 | Autenticación | Completada |
| 5 | Frontend base (Angular), sistema de diseño e i18n | Completada |
| 6 | Landing page | Completada |
| 7 | Dashboard y gestión de regalos | Completada |
| 8 | Publicación del Baby Shower y módulo público de reservas | Completada |
| 9 | Administración de reservas | Completada |
| 10 | Internacionalización completa (ES/EN) | Completada |
| 11 | Pruebas unitarias y de integración | Completada |
| 12 | Documentación y cierre del MVP | Completada |
| 13 | Migración a Next.js full-stack y despliegue en Vercel | Completada |
| 14 | Simplificación del flujo de reservas | Completada |
| 15 | Retiro de la recuperación de contraseña | Completada |
| 16 | Reserva sin correo del invitado | Completada |

Estados posibles: `Pendiente`, `En progreso`, `Completada`, `Bloqueada`.

> **Última actualización:** 2026-11-04. Nota: desde la Fase 13 las variables y credenciales locales viven en perfiles `.env.development`, `.env.test` y `.env.production`, que reemplazan a `environment.m`. Todas las fases del MVP están completadas y verificadas. Al final de cada fase hay una sección **Resultado** con lo que se entregó.

---

## Fase 0 — Preparación y definiciones

**Objetivo:** tomar las decisiones técnicas y de negocio antes de escribir código.

### Tareas

- Verificar las versiones estables (LTS) de Node.js, Angular, NestJS, Prisma, PostgreSQL y Docker.
- Definir la arquitectura del monorepo (gestor de workspaces, organización de `apps/` y `libs/`).
- Definir el modelo de datos inicial: `User`, `BabyShower`, `Gift`, `GiftReservation`, `Category`.
- Documentar las reglas de negocio (cantidades, estados, transaccionalidad de reservas).
- Definir la estrategia de sesión (cookies `HttpOnly` + `Secure` + `SameSite` en lugar de `localStorage`).
- Elegir la librería de i18n compatible con Angular.

### Entregables

- Tabla de versiones seleccionadas.
- Diagrama o descripción del modelo de datos y sus relaciones.
- Lista de reglas de negocio.

### Criterios de aceptación

- Todas las tecnologías tienen versión estable definida.
- El modelo de datos cubre los campos y estados descritos en la especificación.

### Resultado

- Versiones, arquitectura, modelo de datos, reglas de negocio y medidas de seguridad documentadas en [`ARQUITECTURA.md`](ARQUITECTURA.md).
- Sesión con cookies `HttpOnly` e i18n con `@ngx-translate`.

---

## Fase 1 — Infraestructura de desarrollo (primera tarea obligatoria)

**Objetivo:** tener PostgreSQL funcionando en Docker y la estructura base del monorepo creada.

### Tareas

1. Verificar que Docker y Docker Compose estén instalados y en ejecución.
2. Crear la estructura de carpetas del proyecto:
   ```text
   apps/frontend/   apps/backend/
   libs/shared/     libs/contracts/   libs/common/
   prisma/          infrastructure/docker/
   ```
3. Crear `infrastructure/docker/docker-compose.yml` con:
   - Imagen oficial de PostgreSQL (versión estable fijada).
   - Usuario `polcrez`, contraseña `12345`, base de datos `my_baby_shower`, puerto `5432` (solo desarrollo).
   - Volumen persistente.
   - Configuración del esquema (`public`).
   - Healthcheck con `pg_isready`.
   - `restart: unless-stopped`.
4. Crear `environment.m` (credenciales reales, excluido de Git) y `.env.example` (valores de ejemplo).
5. Crear `.gitignore` excluyendo `environment.m`, `.env`, `node_modules/`, `dist/` y volúmenes locales.
6. Descargar la imagen, crear y ejecutar el contenedor.
7. Verificar el estado del contenedor (`healthy`) y la conexión a la base de datos.
8. Dejar preparada la variable `DATABASE_URL` para Prisma.

### Entregables

- `docker-compose.yml`, `environment.m` (local), `.env.example`, `.gitignore`.
- Comandos de inicio y detención documentados en el `README.md`.

### Criterios de aceptación

- `docker compose ps` muestra el contenedor en estado `healthy`.
- `psql` (o `pg_isready`) conecta correctamente con las credenciales de desarrollo.
- Los datos persisten tras reiniciar el contenedor.
- Ninguna credencial real queda versionada.

### Resultado

- PostgreSQL 18.6 (alpine) corre en `my_baby_shower_postgres`, con un volumen persistente, healthcheck `pg_isready`, `restart: unless-stopped` y un script `postgres/init/01-schema.sh` que crea el esquema `DB_SCHEMA`.
- Las credenciales salen de `environment.m` mediante `--env-file`. Si falta una variable, el contenedor no arranca.
- Verificado: el contenedor queda `healthy`, `psql` conecta y `SELECT version()` responde.
- En este equipo el puerto 5432 del host lo ocupaba un PostgreSQL nativo, así que el `environment.m` local usa `DB_PORT=5433`. `.env.example` conserva el 5432.

---

## Fase 2 — Base de datos y Prisma

**Objetivo:** modelar la base de datos con Prisma y aplicar la primera migración.

### Tareas

- Inicializar Prisma y configurar `prisma/schema.prisma` para leer `DATABASE_URL` desde variables de entorno.
- Implementar los modelos `User`, `BabyShower`, `Gift`, `GiftReservation` y `Category` con:
  - Claves primarias (UUID) y foráneas.
  - Índices y restricciones de unicidad (email, username, slug público).
  - Restricciones de integridad (cantidades no negativas, borrados controlados).
  - Campos de auditoría (`createdAt`, `updatedAt`).
  - Enums de estado: `GiftStatus` (Disponible, Parcialmente reservado, Reservado) y `ReservationStatus` (Pendiente, Confirmada, Cancelada, Entregada).
- Generar y aplicar la migración inicial.
- Crear un seed con categorías base (Higiene, Vestuario, Alimentación, Mobiliario, etc.).

### Entregables

- `schema.prisma`, carpeta `prisma/migrations/`, script de seed.

### Criterios de aceptación

- `prisma migrate dev` se ejecuta sin errores contra el contenedor.
- El seed crea las categorías iniciales.
- El identificador público del Baby Shower es no predecible y distinto del ID interno.

### Resultado

- Modelos: `User`, `Session`, `PasswordResetToken`, `BabyShower`, `Category`, `Gift`, `GiftReservation`, más los enums de estado.
- La migración `init` añade restricciones `CHECK` de cantidades, minúsculas y "publicado ⇒ slug".
- El seed idempotente carga 10 categorías. Detalle en `docs/ARQUITECTURA.md`.

---

## Fase 3 — Backend base (NestJS) y seguridad

**Objetivo:** levantar la API con una base segura y modular.

### Tareas

- Crear la aplicación NestJS en `apps/backend`.
- Integrar `PrismaService` como módulo compartido.
- Configurar validación global de DTOs (`class-validator`, `whitelist`, `forbidNonWhitelisted`).
- Configurar Helmet, CORS restringido al origen del frontend y rate limiting (`@nestjs/throttler`).
- Implementar un filtro global de excepciones que no exponga stack traces en producción.
- Configurar un logger que omita contraseñas, tokens y datos sensibles.
- Crear un endpoint de salud (`/health`).

### Entregables

- API ejecutable con estructura modular por dominio.

### Criterios de aceptación

- `/health` responde correctamente y verifica la conexión a la base de datos.
- Las peticiones con datos no válidos se rechazan con errores controlados.
- `npm audit` no reporta vulnerabilidades altas o críticas.

### Resultado

- NestJS 12 (ESM) con validación global de variables de entorno, Helmet, CORS, throttler global, `ValidationPipe` en modo `whitelist` y un filtro de errores sin stack traces.
- Endpoint `/api/health` con verificación de la base de datos y documentación Swagger en `/api/docs` (solo fuera de producción).

---

## Fase 4 — Autenticación

**Objetivo:** permitir el registro e inicio de sesión seguro de los futuros padres.

### Tareas

- Registro con: nombre del padre, nombre de la madre, nombre del bebé, fecha del Baby Shower, descripción opcional, correo, nombre de usuario, contraseña y confirmación.
- Crear en una sola transacción el `User` y su `BabyShower` asociado.
- Hashing de contraseñas con **Argon2id**.
- Inicio y cierre de sesión con tokens de expiración corta y refresh tokens en cookies `HttpOnly`.
- Recuperación de contraseña con token de un solo uso, con expiración y almacenado como hash.
- Guards para proteger rutas privadas; roles cuando sea necesario.
- Rate limiting y protección contra fuerza bruta en login y recuperación.

### Criterios de aceptación

- Ninguna contraseña se almacena en texto plano ni con cifrado reversible.
- Las rutas privadas devuelven `401` sin sesión válida.
- Los tokens expiran y el cierre de sesión los invalida.

### Resultado

- Argon2id, JWT de acceso y refresh rotativo en cookies `HttpOnly`/`SameSite`, y detección de reutilización de refresh tokens.
- Bloqueo de 15 minutos tras 5 intentos fallidos y recuperación de contraseña con un token hasheado de un solo uso que revoca las sesiones.
- Guard global con `@Public()` para las excepciones y `RolesGuard` disponible.

---

## Fase 5 — Frontend base (Angular), sistema de diseño e i18n

**Objetivo:** preparar la aplicación Angular con su identidad visual y soporte multilenguaje.

### Tareas

- Crear la aplicación Angular en `apps/frontend` (componentes standalone).
- Definir los tokens de diseño: paleta pastel (beige, rosa claro, azul cielo, verde menta, lavanda, blanco cálido), tipografía amigable, espaciados y radios.
- Crear componentes reutilizables: botones, campos de formulario, tarjetas de regalo, modales, alertas.
- Configurar la solución de i18n con archivos `assets/i18n/es.json` y `assets/i18n/en.json`, idioma predeterminado español y persistencia del idioma elegido.
- Configurar el cliente HTTP, interceptores y guards de rutas.

### Criterios de aceptación

- La aplicación carga en español y permite cambiar a inglés.
- No hay textos codificados directamente en los componentes.
- El diseño es responsive y cumple pautas básicas de accesibilidad (contraste, foco, etiquetas).

### Resultado

- Angular 22 (standalone, signals, sin zone.js) y tokens de diseño pastel en `styles.scss`.
- Componentes reutilizables: modal (`<dialog>`), tarjeta de regalo, insignias, toasts, diálogo de confirmación, errores de campo y selector de idioma.
- ngx-translate con `assets/i18n` e interceptor de sesión con refresco automático.

---

## Fase 6 — Landing page

**Objetivo:** presentar la plataforma de forma atractiva.

### Tareas

- Generar con IA las imágenes (bebés, decoración, regalos, elementos infantiles) con estética coherente.
- Implementar las secciones: hero, presentación, cómo funciona, beneficios para padres, beneficios para invitados, botones de "Crear Baby Shower" e "Iniciar sesión", y footer.
- Añadir animaciones suaves y discretas.

### Criterios de aceptación

- La página se ve correctamente en móvil, tablet y escritorio.
- Las imágenes están optimizadas y tienen texto alternativo traducido.

### Resultado

- Las 8 secciones de la landing, con ilustraciones SVG generadas con IA (ver `docs/IMAGENES_IA.md`) y animaciones de entrada que respetan `prefers-reduced-motion`.
- Verificado sin scroll horizontal a 375 px.

---

## Fase 7 — Dashboard y gestión de regalos

**Objetivo:** que los padres administren su Baby Shower y su lista de regalos.

### Tareas

- Dashboard con nombre del bebé, información del evento, resumen de regalos (total, disponibles, reservados), enlace público y accesos rápidos.
- CRUD de regalos: nombre, descripción, categoría, cantidad requerida, imagen opcional y estado.
- Administración de cantidades y cálculo automático del estado de disponibilidad.
- Organización y filtrado por categoría.

### Criterios de aceptación

- Un usuario solo puede ver y modificar los regalos de su propio Baby Shower.
- El estado del regalo se actualiza según las cantidades reservadas.

### Resultado

- El dashboard muestra resumen, cuenta regresiva, progreso y accesos rápidos. La página "Mi evento" permite editar los datos.
- CRUD de regalos agrupado por categoría, con filtros, imagen opcional y borrado lógico.

---

## Fase 8 — Publicación del Baby Shower y módulo público de reservas

**Objetivo:** compartir el Baby Shower y permitir que los invitados reserven regalos sin registrarse.

### Tareas

- Acción "Publicar Baby Shower": genera un slug público único y no predecible (por ejemplo `mi-bebe-abc123`) asociado al evento.
- Botón para copiar el enlace.
- Página pública con nombre del bebé, nombres de los padres, fecha, descripción y lista de regalos con su disponibilidad.
- Formulario de reserva: nombre completo, correo opcional, cantidad y mensaje opcional.
- Reserva transaccional con bloqueo de fila o actualización condicional para evitar sobre-reservas concurrentes.
- Mensaje de confirmación tras reservar.
- Rate limiting en el endpoint público de reservas.

### Criterios de aceptación

- No es posible reservar más de la cantidad disponible, incluso con peticiones simultáneas.
- Los regalos agotados no aparecen como disponibles.
- La página pública no expone IDs internos ni datos privados.
- El invitado no puede modificar la lista de regalos.

### Resultado

- Enlace `/baby-shower/<bebé>-<aleatorio>` y página pública con filtros por categoría y "solo disponibles".
- Modal de reserva con código de confirmación y transacción con `SELECT … FOR UPDATE`. Probado: de 6 reservas simultáneas sobre un stock de 3, 3 se aceptan y 3 se rechazan con 409.

---

## Fase 9 — Administración de reservas

**Objetivo:** que los padres gestionen las reservas recibidas.

### Tareas

- Listado de todas las reservas con nombre del invitado, regalo, cantidad, mensaje y estado.
- Filtros por regalo y por estado.
- Cancelar reservas (liberando la cantidad del regalo).
- Marcar reservas como entregadas.
- Historial de reservas.

### Criterios de aceptación

- Cancelar una reserva actualiza de forma transaccional la disponibilidad del regalo.
- Las transiciones de estado son válidas (por ejemplo, una reserva cancelada no puede marcarse como entregada).

### Resultado

- Listado con filtros sincronizados en la URL, acciones según las transiciones permitidas e historial con fechas de cada cambio.
- Al cancelar se liberan unidades.

---

## Fase 10 — Internacionalización completa (ES/EN)

**Objetivo:** traducir el 100 % de la interfaz.

### Tareas

- Traducir textos, botones, mensajes, formularios y validaciones en todos los módulos.
- Traducir los mensajes de error que devuelve el backend mediante códigos de error.
- Revisar formatos de fecha según el idioma.

### Criterios de aceptación

- `es.json` y `en.json` tienen las mismas claves.
- El idioma seleccionado se mantiene durante la navegación y entre recargas.

### Resultado

- 303 claves por idioma, títulos de página traducidos, fechas según el idioma y errores de la API traducidos por código.
- Una prueba automática verifica que ambos archivos tengan las mismas claves.

---

## Fase 11 — Pruebas unitarias y de integración

**Objetivo:** garantizar la calidad y las reglas de negocio.

### Tareas

- Pruebas unitarias de servicios del backend (autenticación, regalos, reservas).
- Pruebas de integración contra una base de datos PostgreSQL de pruebas.
- Prueba de concurrencia de reservas.
- Pruebas de componentes y servicios del frontend.

### Criterios de aceptación

- Las reglas de negocio críticas tienen cobertura de pruebas.
- Todas las pruebas pasan en local.

### Resultado

- 38 pruebas en verde: 4 de dominio (`libs/shared`), 8 unitarias del backend, 9 del frontend y 17 de integración contra PostgreSQL (`my_baby_shower_test`), incluida la de concurrencia.

---

## Fase 12 — Documentación y cierre del MVP

**Objetivo:** dejar el proyecto listo para instalar, ejecutar y continuar.

### Tareas

- Completar el `README.md` con instalación, configuración, ejecución y comandos.
- Documentar la API (por ejemplo con OpenAPI/Swagger).
- Ejecutar `npm audit` y actualizar dependencias si es necesario.
- Revisar la lista del alcance MVP.

### Criterios de aceptación

- Una persona nueva puede levantar el proyecto siguiendo solo el `README.md`.
- Los 13 puntos del alcance MVP están implementados.

### Resultado

- `README.md` con instalación, variables, comandos y API; Swagger; `docs/ARQUITECTURA.md` y `docs/IMAGENES_IA.md`.
- `npm audit`: 0 vulnerabilidades.

---

## Fase 13 — Migración a Next.js full-stack y despliegue en Vercel

**Objetivo:** unificar la interfaz y la API en una sola aplicación Next.js, dentro del monorepo, desplegable en Vercel y conectada a PostgreSQL en Aiven, manteniendo el mismo UI/UX.

### Tareas

- Sustituir Angular (frontend) y NestJS (backend) por `apps/web` (Next.js 16, App Router), siguiendo el patrón del proyecto de referencia `finance_mgmt_mon`: API en `src/app/api/v1`, JWT con `jose` en cookies y rate limiting en la BD.
- Portar los servicios de negocio, las reglas y la seguridad a `src/server/`.
- Portar las páginas y componentes a React, conservando estilos, textos y comportamiento.
- Reemplazar `class-validator` por esquemas zod compartidos entre formularios y API.
- Adaptar a serverless: imágenes en PostgreSQL y rate limiting persistido.
- Configurar la conexión por `DATABASE_URL` con `sslmode` y `schema`, con soporte de CA (Aiven).
- Reescribir las pruebas: unitarias (Vitest y Testing Library) e integración contra los route handlers reales.
- Documentar el despliegue (`docs/DESPLIEGUE.md`).

### Criterios de aceptación

- `npm run build` genera la app sin errores de tipos.
- Las pruebas unitarias y de integración pasan, incluida la de concurrencia.
- La interfaz se ve y funciona igual que la versión Angular, también en móvil y en ES/EN.

### Resultado

- 15 pruebas unitarias y 17 de integración en verde; `npm audit`: 0 vulnerabilidades.
- Verificado en el navegador: registro, regalos con modal, publicación, reserva en inglés (el regalo agotado desaparece), reservas y ausencia de scroll horizontal a 375 px.
- La versión Angular + NestJS queda en el primer commit (`c697b49`).
- **Pendiente:** aplicar las migraciones en Aiven en cuanto se tenga la contraseña correcta, porque la proporcionada fue rechazada.

---

## Fase 14 — Simplificación del flujo de reservas

**Objetivo:** que el invitado sea quien confirma la reserva y que en el panel los padres solo tengan una acción: marcar el regalo como entregado.

### Cambios respecto a la especificación original

- Estados de reserva: de `Pendiente / Confirmada / Cancelada / Entregada` a **`Confirmada → Entregada | Cancelada`**. Ya no existe "Pendiente": el invitado confirma al reservar.
- En el panel se elimina la acción "Confirmar"; quedan **"Marcar como entregado"** (principal) y **"Cancelar reserva"** (secundaria, con confirmación, libera las unidades).
- Migración `20261104210000_restore_reservation_cancel`: vuelve a agregar el estado `CANCELLED`, la columna `cancelled_at` y un `CHECK` (cancelada ⇒ fecha de cancelación).
- Migración `20261104200000_simplify_reservation_status`: las reservas pendientes pasan a confirmadas, se eliminan las canceladas (ya no ocupaban unidades), se borra la columna `cancelled_at` y se agrega un `CHECK` (entregada ⇒ fecha de entrega).

### Resultado

- 18 pruebas unitarias y 19 de integración en verde (incluye que dos cancelaciones simultáneas liberan las unidades una sola vez).
- Verificado en el navegador: una reserva confirmada muestra "Marcar como entregado" y "Cancelar reserva"; al cancelar pide confirmación, libera la unidad y la reserva queda sin acciones.
- **Pendiente:** aplicar las dos migraciones en producción (`npm run prisma:deploy:prod`).

---

## Fase 15 — Retiro de la recuperación de contraseña

**Motivo:** no hay un proveedor de correo (host) para enviar el enlace, así que la opción mostraba "recibirás un enlace" sin que llegara nada.

### Cambios respecto a la especificación original

- Se eliminan el enlace "¿Olvidaste tu contraseña?" del login y del pie de página, las páginas `/forgot-password` y `/reset-password`, los endpoints `/api/v1/auth/forgot-password` y `/reset-password`, el módulo de correo (Resend/SMTP) y la dependencia `nodemailer`.
- Migración `20261104220000_remove_password_reset`: elimina la tabla `password_reset_tokens`.
- La implementación completa sigue en el historial de git y puede restaurarse cuando haya un proveedor de correo.

### Resultado

- 18 pruebas unitarias y 18 de integración en verde; build sin errores; `npm audit`: 0 vulnerabilidades.
- Las rutas antiguas responden 404 y el login ya no muestra el enlace.
- **Pendiente:** se aplicará en producción con el próximo despliegue (o `npm run prisma:deploy:prod`).

---

## Fase 16 — Reserva sin correo del invitado

**Cambio respecto a la especificación original:** el formulario de reserva ya no pide correo. Quedan **nombre completo**, **cantidad** y **mensaje para los padres** (opcional).

- Se quita el campo del formulario, del esquema de la API (enviar `guestEmail` ahora devuelve 400), del contrato y del panel de reservas.
- Migración `20261104230000_remove_guest_email`: elimina la columna `guest_email`.

### Resultado

- 18 pruebas unitarias y 18 de integración en verde; build sin errores.
- Verificado: el formulario muestra solo los tres campos y la reserva se guarda.
- **Pendiente:** se aplicará en producción con el próximo despliegue.

---

## Fuera del alcance del MVP

- Pagos.
- Marketplace.
- Integración con plataformas externas de regalos.
