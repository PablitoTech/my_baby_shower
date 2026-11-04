# Proyecto: my_baby_shower

## 1. Descripción general

Desarrollar una aplicación web denominada **my_baby_shower**, una plataforma digital para la organización y gestión de Baby Showers.

La aplicación permitirá a los futuros padres crear un evento personalizado para su bebé, registrar una lista de regalos o necesidades y compartirla mediante un enlace público. Los invitados podrán consultar los artículos disponibles, seleccionar uno de ellos y reservarlo para entregarlo durante el evento.

El sistema debe contar con una interfaz moderna, intuitiva, responsive y visualmente agradable, utilizando una paleta de colores pastel que combine tonalidades femeninas y masculinas, manteniendo una estética neutra, delicada y apropiada para bebés.

## 2. Tecnologías y arquitectura

Implementar el proyecto utilizando las siguientes tecnologías:

### Arquitectura

- Monorepo con Node.js.
- Angular para el frontend.
- NestJS para el backend.
- Prisma ORM para la gestión de la base de datos.
- PostgreSQL como motor de base de datos.
- Docker y Docker Compose para la infraestructura de desarrollo.
- TypeScript como lenguaje principal.

### Estructura del monorepo

Organizar el proyecto de forma modular y escalable.

La estructura propuesta es:

```text
my_baby_shower/
├── apps/
│   ├── frontend/
│   │   └── Angular
│   └── backend/
│       └── NestJS
├── libs/
│   ├── shared/
│   ├── contracts/
│   └── common/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── infrastructure/
│   └── docker/
│       └── docker-compose.yml
├── environment.m
├── .env.example
├── .gitignore
├── package.json
├── nest-cli.json
├── angular.json
└── README.md
```

La estructura definitiva podrá ajustarse según las mejores prácticas de las versiones estables de las tecnologías seleccionadas.

## 3. Landing Page

Desarrollar una landing page pública que permita presentar la plataforma.

### Características

- Diseño visual atractivo, delicado y moderno.
- Imágenes de bebés, decoración de Baby Shower, regalos y elementos infantiles.
- Las imágenes deben ser generadas mediante inteligencia artificial, con una estética profesional y coherente con el diseño de la plataforma.
- Uso de tonos pastel:
  - Beige.
  - Rosa claro.
  - Azul cielo.
  - Verde menta.
  - Lavanda.
  - Blanco cálido.
- Diseño responsive para dispositivos móviles, tablets y computadores.

### Secciones

1. Hero principal con imagen generada por IA.
2. Presentación de la plataforma.
3. Explicación de cómo funciona.
4. Beneficios para los futuros padres.
5. Beneficios para los invitados.
6. Botón para crear un Baby Shower.
7. Botón para iniciar sesión.
8. Footer con información general y enlaces.

## 4. Registro de usuarios

Implementar un módulo de registro para los futuros padres.

El formulario debe permitir registrar:

### Información del evento y de los padres

- Nombre del padre.
- Nombre de la madre.
- Nombre del bebé.
- Fecha del Baby Shower.
- Descripción opcional del evento.
- Correo electrónico.
- Nombre de usuario.
- Contraseña.
- Confirmación de contraseña.

El registro debe crear una cuenta de usuario y asociar la información del bebé y del evento a dicha cuenta.

El nombre del bebé será el elemento principal de identificación visual del Baby Shower.

### Autenticación

Implementar:

- Registro.
- Inicio de sesión.
- Cierre de sesión.
- Recuperación de contraseña.
- Protección de rutas privadas.
- Gestión segura de sesiones.

Las contraseñas deben almacenarse mediante un algoritmo de hashing seguro, como Argon2id.

Nunca almacenar contraseñas en texto plano ni utilizar cifrado reversible para este propósito.

## 5. Dashboard principal

Una vez autenticados, los usuarios accederán a un dashboard para administrar su Baby Shower.

El dashboard debe incluir:

- Nombre del bebé.
- Información del evento.
- Resumen de regalos registrados.
- Cantidad de regalos disponibles.
- Cantidad de regalos reservados.
- Enlace público del Baby Shower.
- Accesos rápidos a los módulos principales.

## 6. Módulo de gestión de regalos

Implementar un módulo para administrar la lista de regalos y necesidades del bebé.

Los padres podrán crear, consultar, editar y eliminar registros.

### Campos del regalo

- ID.
- Nombre del artículo.
- Descripción.
- Categoría.
- Cantidad requerida.
- Imagen opcional.
- Estado.
- Fecha de creación.
- Fecha de modificación.

### Ejemplos

| Nombre | Descripción | Categoría |
|---|---|---|
| Pañales | Pañales etapa 3 | Higiene |
| Pañitos húmedos | Paquete de pañitos húmedos | Higiene |
| Ropa de bebé | Conjunto de ropa talla 0-3 meses | Vestuario |
| Biberón | Biberón de 150 ml | Alimentación |
| Cuna | Cuna para recién nacido | Mobiliario |

### Funcionalidades

- Crear regalos.
- Editar regalos.
- Eliminar regalos.
- Consultar regalos.
- Administrar cantidades.
- Visualizar el estado de disponibilidad.
- Organizar los artículos por categoría.
- Publicar la lista de regalos.

## 7. Publicación del Baby Shower

Implementar una funcionalidad denominada "Publicar Baby Shower".

Al publicar, el sistema deberá:

1. Generar un enlace público único.
2. Asociar el enlace al evento registrado.
3. Permitir compartirlo mediante copiar enlace.
4. Permitir visualizar la lista de regalos sin autenticación.
5. Mostrar la información del bebé y del evento.
6. Permitir que los invitados reserven regalos.

Ejemplo de URL:

```text
https://my-baby-shower.com/baby-shower/mi-bebe-abc123
```

El enlace debe utilizar un identificador público no predecible y no exponer IDs internos de la base de datos.

## 8. Módulo público de invitados y reservas

Los invitados podrán acceder al Baby Shower mediante el enlace público.

No será obligatorio registrarse como usuario de la plataforma.

### Información pública

- Nombre del bebé.
- Nombres de los padres.
- Fecha del evento.
- Descripción.
- Lista de regalos.
- Estado de disponibilidad de cada regalo.

### Flujo de reserva

1. El invitado ingresa al enlace público.
2. Visualiza los regalos disponibles.
3. Selecciona un regalo.
4. El sistema muestra un formulario de reserva.
5. El invitado ingresa:
   - Nombre completo.
   - Correo electrónico opcional.
   - Cantidad que desea reservar.
   - Mensaje opcional para los padres.
6. El invitado confirma la reserva.
7. El sistema registra la reserva.
8. El regalo cambia su estado de disponibilidad.
9. Se muestra un mensaje de confirmación.

### Reglas de negocio

- Un regalo no debe poder reservarse por encima de su cantidad disponible.
- Los regalos reservados no deben aparecer como disponibles cuando se agote su cantidad.
- La reserva debe ejecutarse de manera transaccional para evitar reservas duplicadas o concurrentes.
- El invitado no debe poder modificar la lista de regalos.
- Los padres podrán consultar quién reservó cada artículo.
- Los padres podrán cancelar reservas desde el dashboard.
- Los invitados podrán visualizar únicamente información pública del evento.

### Estados de los regalos

- Disponible.
- Parcialmente reservado.
- Reservado.

### Estados de las reservas

- Pendiente.
- Confirmada.
- Cancelada.
- Entregada.

## 9. Módulo de administración de reservas

Los padres podrán administrar las reservas realizadas por los invitados.

Funcionalidades:

- Consultar todas las reservas.
- Filtrar por regalo.
- Filtrar por estado.
- Consultar nombre del invitado.
- Consultar cantidad reservada.
- Cancelar reservas.
- Marcar regalos como entregados.
- Consultar el historial de reservas.

## 10. Internacionalización (i18n)

La aplicación debe ser multilenguaje.

### Idiomas iniciales

- Español (es).
- Inglés (en).

### Configuración

El idioma predeterminado será español (es).

La aplicación debe:

- Cargar inicialmente en español.
- Permitir cambiar el idioma desde la interfaz.
- Mantener el idioma seleccionado durante la navegación.
- Traducir textos, botones, mensajes, formularios y validaciones.
- Utilizar archivos de traducción independientes.
- Evitar textos estáticos directamente codificados en los componentes.

Organizar las traducciones, por ejemplo:

```text
apps/frontend/src/assets/i18n/
├── es.json
└── en.json
```

Utilizar una solución de internacionalización compatible con Angular y sus versiones estables.

## 11. Base de datos PostgreSQL

Utilizar PostgreSQL con Prisma ORM.

Crear un archivo de configuración denominado `environment.m` que permita definir las credenciales de conexión a la base de datos.

Debe contemplar:

- Host.
- Puerto.
- Usuario.
- Contraseña.
- Nombre de la base de datos.
- Esquema.

La configuración de conexión debe ser consumida por Prisma mediante variables de entorno.

Ejemplo conceptual:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=polcrez
DB_PASSWORD=12345
DB_NAME=my_baby_shower
DB_SCHEMA=public
```

El archivo `environment.m` debe ser tratado como configuración de entorno y no debe contener credenciales dentro del código fuente.

Crear también un archivo `.env.example` con valores de ejemplo.

El archivo con credenciales reales debe estar excluido del control de versiones.

### Modelos iniciales de Prisma

Diseñar los siguientes modelos:

- User.
- BabyShower.
- Gift.
- GiftReservation.
- Category.

Establecer correctamente las relaciones entre los modelos.

Incluir:

- Claves primarias.
- Claves foráneas.
- Índices.
- Restricciones de integridad.
- Campos de auditoría.
- Estados de los registros.

## 12. Docker para PostgreSQL

Inicialmente, generar y ejecutar únicamente la infraestructura de PostgreSQL mediante Docker.

Crear un archivo `docker-compose.yml`.

### Configuración de desarrollo

- Imagen oficial de PostgreSQL.
- Usuario: polcrez.
- Contraseña: 12345.
- Base de datos: my_baby_shower.
- Puerto: 5432.
- Volumen persistente.
- Configuración del esquema.
- Healthcheck.
- Reinicio automático del contenedor.

La contraseña indicada es exclusivamente para desarrollo local.

No utilizar estas credenciales en ambientes productivos.

### Actividades iniciales

1. Verificar que Docker esté instalado y funcionando.
2. Crear el archivo Docker Compose.
3. Descargar la imagen de PostgreSQL.
4. Crear el contenedor.
5. Ejecutar PostgreSQL.
6. Verificar el estado del contenedor.
7. Verificar la conexión a la base de datos.
8. Dejar preparada la configuración para Prisma.

## 13. Seguridad

Implementar buenas prácticas de seguridad desde el inicio.

### Backend

- Utilizar versiones estables y mantenidas de Node.js y NestJS.
- Validación de DTOs.
- Sanitización y validación de entradas.
- Protección contra SQL Injection utilizando Prisma.
- Control de acceso basado en roles cuando sea necesario.
- Rate limiting en endpoints sensibles.
- Protección contra ataques de fuerza bruta.
- CORS configurado correctamente.
- Helmet.
- Manejo seguro de errores.
- No exponer stack traces en producción.
- No registrar contraseñas ni información sensible en logs.

### Autenticación

- Hashing de contraseñas mediante Argon2id.
- Tokens o sesiones con expiración.
- Protección de endpoints privados.
- Recuperación de contraseña mediante mecanismos seguros.
- No almacenar tokens sensibles en localStorage si se puede utilizar una estrategia más segura.

### Gestión de dependencias

- Utilizar versiones estables y seguras.
- Evitar dependencias obsoletas.
- Revisar vulnerabilidades con npm audit.
- No utilizar versiones experimentales en producción.
- Mantener las dependencias actualizadas.

## 14. Diseño UI/UX

El diseño debe tener una identidad visual delicada, moderna y profesional.

### Lineamientos

- Colores pastel.
- Tipografía amigable.
- Componentes reutilizables.
- Tarjetas de regalos.
- Formularios intuitivos.
- Dashboard moderno.
- Diseño responsive.
- Animaciones suaves y discretas.
- Imágenes generadas por IA.
- Experiencia accesible.

La plataforma debe ser visualmente neutral, de modo que funcione tanto para Baby Showers de niñas como de niños.

## 15. Alcance inicial (MVP)

En la primera etapa, implementar:

1. Landing page.
2. Registro de usuarios.
3. Inicio de sesión.
4. Dashboard.
5. Gestión de regalos.
6. Publicación del Baby Shower.
7. Generación de enlace público.
8. Consulta pública de regalos.
9. Reservas por parte de invitados.
10. Administración de reservas.
11. Internacionalización ES/EN.
12. PostgreSQL con Prisma.
13. Docker Compose para desarrollo.

No implementar inicialmente funcionalidades de pagos, marketplace ni integración con plataformas externas de regalos.

## 16. Metodología de desarrollo

Desarrollar el proyecto de manera incremental.

Antes de comenzar:

- Verificar las versiones estables de las tecnologías.
- Definir la arquitectura del monorepo.
- Definir el modelo de datos.
- Establecer las reglas de negocio.
- Preparar la infraestructura Docker.

Después:

- Implementar la base de datos.
- Configurar Prisma.
- Implementar el backend.
- Implementar el frontend.
- Implementar autenticación.
- Implementar los módulos funcionales.
- Implementar las traducciones.
- Realizar pruebas unitarias e integración.
- Documentar la instalación y ejecución.

### Primera tarea obligatoria

Inicialmente, trabajar únicamente en la infraestructura de desarrollo:

1. Crear la estructura del proyecto `my_baby_shower`.
2. Configurar Docker Compose.
3. Crear la base de datos PostgreSQL.
4. Ejecutar el contenedor.
5. Verificar su funcionamiento.
6. Documentar los comandos necesarios para iniciar y detener la base de datos.

No avanzar a la implementación completa del frontend o backend hasta tener la infraestructura inicial funcionando correctamente.

El código debe ser limpio, modular, mantenible, seguro y preparado para futuras funcionalidades.
