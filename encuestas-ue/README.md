# encuestas-ue

Frontend Angular para la plataforma académica de encuestas de Uniempresarial. La aplicación permite autenticarse, consultar encuestas disponibles, responderlas y ofrece un área administrativa para crear encuestas, consultar un dashboard y administrar perfiles.

Este documento refleja el estado actual del código inspeccionado en `src/`. Algunas pantallas administrativas todavía usan datos estáticos y hay pendientes de integración documentados al final.

## Requisitos previos

- Node.js compatible con Angular 22.
- npm 12.0.1 o una versión compatible.
- Backend disponible en `http://localhost:3001/api` para login, registro, perfil y encuestas.
- Navegador moderno con soporte para Angular standalone components.

La versión de Angular CLI declarada por el proyecto es `22.0.7`; TypeScript es `~6.0.2`.

## Instalación y ejecución

Desde esta carpeta (`encuestas-ue`):

```bash
npm install
npm start
```

También puede ejecutarse directamente con:

```bash
npx ng serve
```

La aplicación queda disponible en `http://localhost:4200/`. Para cambiar el puerto:

```bash
npx ng serve --port 4300
```

El backend se configura en `src/environment/environment.ts` y en `src/environment/environment.development.ts`, mediante `environment.apiUrl`.

## Arquitectura y mapa de ubicación

El proyecto usa Angular standalone, sin `NgModule` raíz. El arranque sigue este flujo:

1. `src/main.ts` ejecuta `bootstrapApplication(App, appConfig)`.
2. `src/app/app.ts` monta el `RouterOutlet` raíz.
3. `src/app/app.config.ts` registra router, HttpClient, interceptor y listeners globales.
4. `src/app/app.routes.ts` resuelve las rutas públicas y las áreas protegidas.

```text
src/
├── main.ts                         Punto de entrada de Angular
├── index.html                      Documento HTML raíz
├── styles.scss                     Estilos globales, Bootstrap y variables de diseño
├── environment/
│   ├── environment.ts              Configuración base
│   └── environment.development.ts  Reemplazo usado por ng serve
└── app/
	├── app.ts / app.html / app.scss / app.config.ts
	├── app.routes.ts               Rutas públicas, admin y usuario
	├── core/
	│   ├── auth/                   Servicio, guard e interceptor de autenticación
	│   └── services/               Comunicación con el backend de encuestas
	├── features/
	│   ├── auth/                   Login, registro, recuperación y cierre de sesión
	│   ├── admin/                  Dashboard, encuestas, creación, docentes y preguntas
	│   ├── user/                   Encuestas disponibles, respuesta y confirmación
	│   └── profile/                Consulta y edición del perfil
	├── shared/
	│   ├── layout/                 Shell visual y navegación lateral
	│   ├── models/                 Interfaces y tipos de dominio
	│   └── utils/                  Compresión de imágenes a Base64
	└── docs/                       Guía de integración con el backend
```

### Guía rápida de modificación

| Necesidad | Ubicación |
| --- | --- |
| Cambiar una ruta | `src/app/app.routes.ts`, `src/app/features/admin/admin.routes.ts` o `src/app/features/user/user.routes.ts` |
| Cambiar login, registro o sesión | `src/app/features/auth/` y `src/app/core/auth/auth.service.ts` |
| Cambiar autorización de navegación | `src/app/core/auth/auth.guard.ts` |
| Cambiar headers de autenticación | `src/app/core/auth/auth.interceptor.ts` |
| Cambiar endpoints o payloads de encuestas | `src/app/core/services/encuestas.service.ts` |
| Cambiar el listado de encuestas del estudiante | `src/app/features/user/available-surveys/` |
| Cambiar el formulario de respuesta | `src/app/features/user/surveys/` |
| Cambiar la creación administrativa | `src/app/features/admin/surveys/create/` |
| Cambiar dashboard administrativo | `src/app/features/admin/dashboard/` |
| Cambiar perfil o foto | `src/app/features/profile/` y `src/app/shared/utils/imagen.util.ts` |
| Cambiar navegación y layout | `src/app/shared/layout/app-layout/` |
| Cambiar tipos de dominio | `src/app/shared/models/` |
| Cambiar colores, tipografías o Bootstrap | `src/styles.scss` |
| Cambiar URL del backend | `src/environment/environment*.ts` |

## Rutas

La ruta raíz redirige a `/login`. Las rutas `/admin/**` y `/user/**` usan `AppLayout` y `authGuard`.

### Públicas

| Ruta | Componente | Responsabilidad |
| --- | --- | --- |
| `/login` | `LoginComponent` | Inicio de sesión por correo y contraseña |
| `/register` | `RegisterComponent` | Registro con validación de contraseñas |
| `/forgot-password` | `ForgotPasswordComponent` | Formulario de recuperación, actualmente pendiente de backend |
| `/session-closed` | `SessionClosedComponent` | Pantalla posterior al cierre de sesión |

### Administrativas

| Ruta | Componente | Estado actual |
| --- | --- | --- |
| `/admin` | Redirección | Va a `/admin/dashboard` |
| `/admin/dashboard` | `Dashboard` | Dashboard con datos estáticos |
| `/admin/surveys` | `Surveys` | Filtros sobre encuestas estáticas |
| `/admin/surveys/create` | `CreateSurvey` | Formulario conectado a `POST /api/surveys` |
| `/admin/teachers` | `Teachers` | Pantalla estructural sin lógica de datos |
| `/admin/profile` | `ProfileComponent` | Consulta del perfil |
| `/admin/profile/edit` | `ProfileEditComponent` | Actualización de nombre y foto |

### Usuario

| Ruta | Componente | Responsabilidad |
| --- | --- | --- |
| `/user` | Redirección | Va a `/user/available-surveys` |
| `/user/available-surveys` | `AvailableSurveysComponent` | Lista encuestas disponibles desde el backend |
| `/user/responder-encuesta/:id` | `SurveysComponent` | Carga una encuesta y envía respuestas |
| `/user/responder-encuesta/:id/completada` | `SurveySuccess` | Confirmación visual con datos actualmente estáticos |
| `/user/profile` | `ProfileComponent` | Consulta del perfil |
| `/user/profile/edit` | `ProfileEditComponent` | Edición del perfil |

`Responses` existe como componente, pero no está registrada en `user.routes.ts`. Además, el menú de `AppLayout` apunta a `/user/surveys` y `/user/responses`, rutas que actualmente no existen; el listado implementado está en `/user/available-surveys`.

## Componentes y responsabilidades

Todos los componentes actuales son standalone, aunque varios omiten explícitamente `standalone: true`, comportamiento permitido por la configuración moderna de Angular.

- `App`: componente raíz que contiene el `router-outlet`.
- `AppLayout`: shell autenticado, sidebar responsive, navegación contextual, perfil y logout.
- `LoginComponent`: formulario reactivo de login y alternancia de contraseña.
- `RegisterComponent`: formulario reactivo de registro y validador de coincidencia de contraseñas.
- `ForgotPasswordComponent`: captura el correo y delega en `AuthService`.
- `SessionClosedComponent`: enlace para volver a autenticarse.
- `ProfileComponent`: presenta nombre y apellido derivados de `currentUser`.
- `ProfileEditComponent`: edita nombre, apellido y foto; comprime la imagen antes de enviarla.
- `AvailableSurveysComponent`: obtiene encuestas, adapta la respuesta del backend y navega a responder.
- `SurveysComponent`: carga preguntas, conserva respuestas por pregunta, calcula progreso y finaliza el envío.
- `SurveySuccess`: muestra confirmación con valores de ejemplo.
- `Dashboard`: muestra KPIs, gráfico CSS y promedios estáticos por pregunta.
- `Surveys`: filtra por texto y estado una colección estática del área admin.
- `CreateSurvey`: formulario dinámico de preguntas y creación real mediante el servicio.
- `Teachers`: estructura inicial para docentes, sin consulta al backend.
- `Questions`: estructura inicial para preguntas, sin lógica.
- `Responses`: estructura inicial para respuestas, sin ruta activa.

Cada feature mantiene su template `.html`, estilos `.scss` y, en la mayoría de los casos, un `.spec.ts` generado por Angular.

## Servicios, estado y API

### `AuthService`

`src/app/core/auth/auth.service.ts` es singleton (`providedIn: 'root'`) y concentra:

- Login: `POST /api/login` con `{ email, password }`.
- Registro: `POST /api/register` con `{ name, email, password }`; el backend debe generar `password_hash` y asignar estado y rol.
- Perfil: `PUT /api/profile` con nombre completo y `foto_perfil` en Base64.
- Persistencia de sesión en `localStorage` bajo `token` y `user`.
- Estado reactivo con Angular Signals: usuario, rol, errores, loading, foto y flags de operación.
- Logout local y navegación a `/session-closed`.

Login y registro usan exclusivamente `HttpClient` contra `environment.apiUrl`: `POST /login` y `POST /register` (por ejemplo, `http://localhost:3001/api/login`). Los payloads usan los nombres `email` y `name` del modelo relacional `users`; el backend es responsable de almacenar la contraseña como hash y de definir estado/rol. No hay inicialización ni imports de Firebase en la aplicación. `sendPasswordReset()` continúa como placeholder y no realiza una llamada al backend.

### `EncuestasService`

Usa `environment.apiUrl + '/surveys'` y expone:

| Método | HTTP | Endpoint | Uso |
| --- | --- | --- | --- |
| `obtenerEncuestasDisponibles` | GET | `/api/surveys` | Lista y mapea encuestas para estudiantes |
| `obtenerTodasLasEncuestas` | GET | `/api/surveys` | Lista administrativa sin tipado de salida |
| `obtenerEncuestaPorId` | GET | `/api/surveys/:id` | Detalle y preguntas |
| `crearEncuesta` | POST | `/api/surveys` | Crea encuesta y preguntas |
| `actualizarEncuesta` | PUT | `/api/surveys/:id` | Actualiza encuesta |
| `publicarEncuesta` | PATCH | `/api/surveys/:id/publish` | Publica encuesta |
| `desactivarEncuesta` | PATCH | `/api/surveys/:id/deactivate` | Desactiva encuesta |
| `enviarRespuestas` | POST | `/api/surveys/:id/respuestas` | Guarda respuestas del estudiante |

La lista de encuestas acepta filtros `busqueda` y `estado` como query params. `obtenerEncuestasDisponibles` tolera respuestas en arreglo directo o dentro de `data`, `encuestas` o `items`, y transforma estados del backend `Activa`/`Publicada` a `DISPONIBLE`.

### Guard e interceptor

- `authGuard` espera `authReadyPromise`, permite acceso si existe `localStorage.token` y redirige a `/login` si no. `bypassAuthForDev` existe, pero está en `false`.
- `authInterceptor` añade `Authorization: Bearer <token>` a las peticiones cuando existe un token REST guardado en `localStorage`.
- `EncuestasService` también crea manualmente el mismo header en `getOptions()`. Conviene escoger un único mecanismo para evitar duplicación y divergencias futuras.

### Estado

No hay NgRx ni un store externo. El estado se reparte entre Signals de `AuthService`, estado local de componentes y `localStorage`. Los formularios usan Reactive Forms; el dashboard y varios listados conservan datos mock en memoria.

## Modelos y utilidades

- `Encuesta`: encuesta administrativa, profesor, estado, fecha y preguntas.
- `EncuestaDisponible`: vista adaptada para el estudiante.
- `Pregunta`: enunciado y tipo `Escala 1 - 5` o `Abierta`.
- `Item`: entidad genérica con nombre, descripción, estado y categoría.
- `TipoEncuesta`: `DOCENTE`, `CURSO` o `INSTITUCIONAL`.
- `EstadoEncuestaAdmin`: `BORRADOR`, `ACTIVA` o `INACTIVA`.
- `imagen.util.ts`: redimensiona imágenes hasta 200 px en su lado mayor y devuelve JPEG Base64 con calidad `0.7`.

## Configuración y estilos

`angular.json` define `src` como `sourceRoot`, usa `src/main.ts`, compila SCSS y copia todo `public/` como assets. La configuración de desarrollo reemplaza `environment.ts` por `environment.development.ts`; ambas configuraciones apuntan actualmente a `http://localhost:3001/api`.

Dependencias principales:

- Angular 22: core, router, forms, compiler y build.
- RxJS 7.8 para observables.
- Bootstrap 5.3.8 y Bootstrap Icons 1.13.1.
- SweetAlert2 para confirmaciones y errores del flujo de respuesta.
- Vitest y `jsdom` para pruebas unitarias mediante Angular CLI.

Los estilos globales están en `src/styles.scss`: importan DM Sans, Bootstrap Icons y Bootstrap SCSS; definen variables de color, tipografía, botones, tarjetas, estados de carga/error y placeholders en gris claro (`#adb5bd`). Cada feature mantiene estilos encapsulados en su `.scss`. El layout usa la imagen `public/img/logo-uniempresarial-2.png`.

## Pruebas y estado de calidad

Comandos disponibles:

```bash
npm run build
npm test -- --watch=false
```

Estado verificado:

- La compilación de producción finaliza correctamente; mantiene advertencias por `@import` Sass obsoleto, presupuestos de bundle/estilos y `sweetalert2` CommonJS.
- Las pruebas no llegan a ejecutarse porque cinco specs importan clases que no existen con esos nombres: `Login`, `Register`, `ForgotPassword`, `AvailableSurveys` y `Surveys`. Las clases exportadas actuales son `LoginComponent`, `RegisterComponent`, `ForgotPasswordComponent`, `AvailableSurveysComponent` y `SurveysComponent`.
- No hay configuración E2E ni script funcional `ng e2e` en `package.json`.

## Observaciones técnicas prioritarias

1. Corregir los imports y tipos de los cinco specs para que coincidan con las clases exportadas.
2. Revisar los presupuestos de `angular.json` o reducir/optimizar la fuente externa para que `npm run build` pase en producción.
3. Alinear el menú de `AppLayout` con las rutas reales (`/user/available-surveys`) y decidir si debe implementarse `/user/responses`.
4. Añadir un guard de rol para `/admin/**`; `authGuard` solo verifica que exista un token.
5. Sustituir mocks administrativos por servicios y contratos tipados cuando el backend exponga esos endpoints.
6. Evitar `any` en respuestas HTTP, sesión y construcción de modelos; validar el contrato del backend y manejar errores de red con estados visibles.
7. Mantener una estrategia consistente para el token REST entre `localStorage`, el interceptor y las llamadas protegidas; evitar la duplicación de headers manuales.
8. Revisar el uso de `displayName` en perfil: `AuthService` guarda principalmente `nombre`, por lo que el perfil puede mostrar `(sin nombre)` aunque la sesión tenga datos.

## Scripts npm

| Script | Comando |
| --- | --- |
| `start` | `ng serve` |
| `build` | `ng build` |
| `watch` | `ng build --watch --configuration development` |
| `test` | `ng test` |

## Estructura del repositorio

El workspace superior contiene documentación y la aplicación Angular en `ProyectoEncuestas_Front/encuestas-ue`. Los comandos de esta guía deben ejecutarse dentro de `encuestas-ue`, donde están `package.json` y `angular.json`.
