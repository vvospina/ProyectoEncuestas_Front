# Documentacion del frontend Encuestas UE

Documento elaborado desde el codigo actual de `encuestas-ue`. **BACKEND REAL** significa que el frontend contiene y ejecuta la llamada; no demuestra que exista o funcione el endpoint del servidor. La existencia, autenticacion, validacion y forma efectiva de las respuestas del backend quedan **NO VERIFICADO**: en este workspace no hay codigo backend ni `BACKEND.md`.

Las fuentes se enlazan en cada apartado. Las rutas de los enlaces son relativas a este documento.

## 1. Arquitectura

### Arbol comentado

```text
encuestas-ue/src/app/
|-- core/
|   |-- auth/                 AuthService, authGuard/adminGuard y authInterceptor
|   `-- services/             EncuestasService (API) y QrService (genera PNG/data URL)
|-- features/
|   |-- auth/                 login, registro, recuperacion y cierre de sesion
|   |-- admin/
|   |   |-- dashboard/        dashboard de datos fijos
|   |   |-- questions/        componente placeholder sin ruta
|   |   `-- surveys/          listado, alta/edicion/lectura, resultados y QR
|   |-- profile/              perfil y edicion, compartidos por admin/usuario
|   `-- user/                 encuestas disponibles, respuesta y confirmacion
`-- shared/
    |-- layout/app-layout/    sidebar/topbar y router-outlet para admin/usuario
    |-- models/               interfaces y tipos de encuestas/respuestas
    `-- utils/                compresion de imagen a data URL JPEG
```

El arbol se contrasta con los archivos reales en [src/app](../encuestas-ue/src/app), las rutas en [app.routes.ts](../encuestas-ue/src/app/app.routes.ts), [admin.routes.ts](../encuestas-ue/src/app/features/admin/admin.routes.ts) y [user.routes.ts](../encuestas-ue/src/app/features/user/user.routes.ts). `features/user/responses` existe como placeholder, pero no forma parte de las rutas.

### Versiones y librerias

| Paquete         |                                                             Version fijada/declarada | Uso observado                                                                                                 |
| --------------- | -----------------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------- |
| Angular         | `@angular/core` 22.1.3 en lockfile; dependencias Angular `^22.0.0` en `package.json` | Router, formularios reactivos/no reactivos, signals y componentes.                                            |
| TypeScript      |                                                                             `~6.0.2` | Aplicacion Angular.                                                                                           |
| Bootstrap       |                                                                                5.3.8 | SCSS de Bootstrap importado globalmente.                                                                      |
| Bootstrap Icons |                                                                               1.13.1 | Iconos de varias plantillas.                                                                                  |
| SweetAlert2     |                                                                             11.26.25 | Alertas de autenticacion, carga/envio y errores.                                                              |
| `qrcode`        |                                                                                1.5.4 | Generacion del QR en imagen/data URL; no escaneo.                                                             |
| RxJS            |                                                                    7.8.2 en lockfile | Observables HTTP y `firstValueFrom`.                                                                          |
| Firebase        |                                                                              12.18.0 | Dependencia declarada, sin import/uso Firebase encontrado en `src/app`; autenticacion actual por REST propio. |
| Capacitor       |                                                                                8.5.2 | Dependencia Android presente; no cambia el contrato HTTP descrito aqui.                                       |

Fuente de rangos: [encuestas-ue/package.json](../encuestas-ue/package.json). Versiones fijadas de Core, Bootstrap, Bootstrap Icons, SweetAlert2, `qrcode`, RxJS, Firebase y Capacitor: [encuestas-ue/package-lock.json](../encuestas-ue/package-lock.json). Importaciones globales: [styles.scss](../encuestas-ue/src/styles.scss). Uso de QR: [qr.service.ts](../encuestas-ue/src/app/core/services/qr.service.ts). Versiones resueltas de otros paquetes Angular individuales: **NO VERIFICADO** en este resumen.

### Angular standalone, providers y entorno

La raiz arranca con `bootstrapApplication(App, appConfig)` y el shell usa `RouterOutlet`. Hay componentes con `standalone: true` explicito y otros con `imports` de componente standalone de Angular 22. [main.ts](../encuestas-ue/src/main.ts), [app.ts](../encuestas-ue/src/app/app.ts), [app.config.ts](../encuestas-ue/src/app/app.config.ts)

`app.config` registra `provideBrowserGlobalErrorListeners()`, `provideRouter(routes)` y `provideHttpClient(withInterceptors([authInterceptor]))`. Por tanto, **si, el interceptor esta registrado realmente**.

| Variable           | Valor en los dos archivos   | Efecto verificado                                                                                      |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `apiUrl`           | `http://localhost:3001/api` | Prefijo usado por AuthService y EncuestasService.                                                      |
| `production`       | `false`                     | Condiciona el bypass del `authGuard`; el valor sigue siendo `false` incluso en `environment.ts`.       |
| `bypassAuthForDev` | `false`                     | El bypass solo corre si `!production && bypassAuthForDev`; con el valor actual no omite autenticacion. |
| `devForceRole`     | `undefined`                 | No hay lectura/uso de esta propiedad en `src/app`; actualmente no fuerza rol alguno.                   |

Los objetos de [environment.ts](../encuestas-ue/src/environment/environment.ts) y [environment.development.ts](../encuestas-ue/src/environment/environment.development.ts) tienen los mismos valores. `angular.json` reemplaza el primero por el segundo en configuracion development; `serve` usa development por defecto y `build` production por defecto. Como ambos dicen `production: false`, la bandera no distingue el build de produccion. [angular.json](../encuestas-ue/angular.json)

## 2. Rutas

Todas las rutas admin heredan `authGuard` y `adminGuard` desde el padre `/admin`; todas las rutas user heredan `authGuard` desde `/user`. El `AppLayout` es el componente contenedor de ambas ramas. [app.routes.ts](../encuestas-ue/src/app/app.routes.ts)

| Ruta completa                             | Componente/resolucion                                      | Guards       | Existe                             |
| ----------------------------------------- | ---------------------------------------------------------- | ------------ | ---------------------------------- |
| `/`                                       | redireccion a `/login`                                     | ninguno      | Si                                 |
| `/login`                                  | `LoginComponent`                                           | ninguno      | Si                                 |
| `/session-closed`                         | `SessionClosedComponent`                                   | ninguno      | Si                                 |
| `/register`                               | `RegisterComponent`                                        | ninguno      | Si                                 |
| `/forgot-password`                        | `ForgotPasswordComponent`                                  | ninguno      | Si                                 |
| `/admin`                                  | redirige a `/admin/dashboard` dentro de `AppLayout`        | auth + admin | Si                                 |
| `/admin/profile`                          | `ProfileComponent`                                         | auth + admin | Si                                 |
| `/admin/profile/edit`                     | `ProfileEditComponent`                                     | auth + admin | Si                                 |
| `/admin/dashboard`                        | `Dashboard`                                                | auth + admin | Si                                 |
| `/admin/surveys`                          | `Surveys`                                                  | auth + admin | Si                                 |
| `/admin/surveys/create`                   | `CreateSurvey` en modo crear                               | auth + admin | Si                                 |
| `/admin/surveys/:id/edit`                 | `CreateSurvey` en modo editar                              | auth + admin | Si                                 |
| `/admin/surveys/:id`                      | `CreateSurvey` en modo lectura                             | auth + admin | Si                                 |
| `/admin/surveys/:id/results`              | `SurveyResults`                                            | auth + admin | Si                                 |
| `/admin/surveys/:id/results/:studentId`   | `StudentAnswers`                                           | auth + admin | Si                                 |
| `/user`                                   | redirige a `/user/available-surveys` dentro de `AppLayout` | auth         | Si                                 |
| `/user/profile`                           | `ProfileComponent`                                         | auth         | Si                                 |
| `/user/profile/edit`                      | `ProfileEditComponent`                                     | auth         | Si                                 |
| `/user/available-surveys`                 | `AvailableSurveysComponent`                                | auth         | Si                                 |
| `/user/responder-encuesta/:id`            | `SurveysComponent`                                         | auth         | Si                                 |
| `/user/responder-encuesta/:id/completada` | `SurveySuccess`                                            | auth         | Si; el envio actual no navega aqui |
| cualquier otra ruta (`**`)                | redireccion a `/login`                                     | ninguno      | Si, comodin                        |

Fuentes y componentes: [admin.routes.ts](../encuestas-ue/src/app/features/admin/admin.routes.ts), [user.routes.ts](../encuestas-ue/src/app/features/user/user.routes.ts), [login.ts](../encuestas-ue/src/app/features/auth/login/login.ts), [register.ts](../encuestas-ue/src/app/features/auth/register/register.ts), [forgot-password.ts](../encuestas-ue/src/app/features/auth/forgot-password/forgot-password.ts), [session-closed.ts](../encuestas-ue/src/app/features/auth/session-closed/session-closed.ts), [profile.ts](../encuestas-ue/src/app/features/profile/view/profile.ts), [profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts), [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts), [surveys.ts admin](../encuestas-ue/src/app/features/admin/surveys/surveys.ts), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts), [survey-results.ts](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts), [student-answers.ts](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts), [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts), [surveys.ts user](../encuestas-ue/src/app/features/user/surveys/surveys.ts), [survey-success.ts](../encuestas-ue/src/app/features/user/survey-success/survey-success.ts).

### Navegacion y destinos

Se revisaron los `routerLink`, `navigate` y el menu del layout en las plantillas/componentes anteriores. Todos los destinos operativos revisados tienen ruta, excepto el enlace del menu user: en [app-layout.html](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.html) aparece `<a> routerLink="/user/available-surveys" ...`, con el atributo despues del `>`; no es un `routerLink` Angular, no navega ni dispara el comodin, y el clic solo cierra el sidebar. El destino `/user/available-surveys` si existe.

`adminGuard` **si se usa** en el padre `/admin` y se aplica a sus hijos. Aun asi, el guard solo deja pasar cuando hay token y `currentUser.roleId === 1` (numero); no acepta `role_id`, `rol`, ni `roleId` string, aunque AuthService si contempla mas formas al mapear el rol. El comentario de `auth.guard.ts` que dice que habria que crear el guard contradice su declaracion/uso actual. [auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)

`/admin/questions` no tiene ruta, aunque existe un placeholder `Questions`; `/user/responses` tampoco esta registrado y `Responses` es placeholder. En navegacion directa caerian en `**` y volverian al login. El menu de user roto no activa ninguna ruta. [questions.ts](../encuestas-ue/src/app/features/admin/questions/questions.ts), [responses.ts](../encuestas-ue/src/app/features/user/responses/responses.ts)

## 3. Autenticacion

- **Login:** `POST /api/login` con correo/contrasena. AuthService acepta el token en `token` o `access_token`, y datos de usuario en `user`, `usuario` o en la respuesta completa. Guarda sesion, muestra SweetAlert y despues navega a `/admin/dashboard` si el rol normalizado es `ADMIN`, o a `/user/available-surveys` en otro caso. [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), [login.ts](../encuestas-ue/src/app/features/auth/login/login.ts)
- **Registro:** `POST /api/users` con `name`, `email`, `password`, `status: 1`; no inicia sesion, muestra exito y redirige a login. La respuesta se ignora. [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)
- **Claves localStorage:** `token` guarda `data.token || data.access_token`; `user` guarda `JSON.stringify(data.user || data.usuario || data)` despues de normalizar. No hay otras claves de sesion escritas por AuthService. Perfil actualiza `user`; logout elimina `token` y `user`. [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)
- **Usuario normalizado:** se agrega `displayName = user.displayName ?? user.name ?? ''`. La foto se lee de `avatarBase64 || foto_perfil`. Rol admin si `Number(roleId ?? role_id) === 1` o `rol === 'Administrador'`; el registro no envia rol. El rol no se deriva de `role` en ingles. Login asigna `ADMIN` o `USER`; restauracion puede conservar `user.rol` como valor distinto (`Docente`, por ejemplo). [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)
- **Restauracion al recargar:** constructor llama `restaurarSesion()`, lee ambas claves, parsea JSON y fija signals; despues marca `authReady=true` y resuelve `authReadyPromise`. JSON corrupto no se captura: consecuencia en ejecucion **NO VERIFICADO**. [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)
- **Guardas:** `authGuard` deja pasar si el bypass de desarrollo esta activo; de lo contrario espera `authReadyPromise` y comprueba solo que exista token. `adminGuard` espera lo mismo y verifica `roleId === 1`; ambos redirigen a login si deniegan. Son controles de interfaz, no sustituyen autorizacion de backend (el propio comentario del guard lo indica). [auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts)
- **Interceptor:** clona toda peticion HTTP y agrega `Authorization: Bearer <token>` solo cuando existe token. Esta registrado en `app.config`. [auth.interceptor.ts](../encuestas-ue/src/app/core/auth/auth.interceptor.ts), [app.config.ts](../encuestas-ue/src/app/app.config.ts)
- **Logout:** borra token/usuario, limpia `currentUser` y `userRole` y navega a `/session-closed`; `photoBase64` y otros signals no se limpian explicitamente. [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)

## 4. Servicios y llamadas HTTP

Prefijo observado: `http://localhost:3001/api`. Los endpoints de esta tabla son rutas que el frontend construye; **existencia/contrato del servidor: NO VERIFICADO**. El codigo HTTP esta centralizado en AuthService y EncuestasService; los componentes no usan directamente `HttpClient`. [environment.ts](../encuestas-ue/src/environment/environment.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts)

`getOptions()` de EncuestasService manda `Content-Type: application/json` y `Authorization: Bearer ${token || ''}` (incluye `Bearer ` aunque falte token), mas query params opcionales. En llamadas sin `getOptions`, el interceptor agrega Authorization solo si encuentra token; no hay headers explicitos de servicio. Las peticiones JSON de AuthService no configuran headers a mano. En actualizacion de perfil se pone Authorization manualmente y el interceptor puede volver a escribirlo. [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts), [auth.interceptor.ts](../encuestas-ue/src/app/core/auth/auth.interceptor.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)

| Metodo frontend                    | Verbo y URL                                                              | Headers/body enviado                                                     | Respuesta/mapeo que asume                                                                                                                                                                                                | Caller / estado                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `registerWithEmail`                | `POST /users`                                                            | JSON `{name,email,password,status:1}`; sin headers explicitos            | Ignora respuesta; espera que la llamada no falle                                                                                                                                                                         | `RegisterComponent`; invocado. Backend **NO VERIFICADO**.                             |
| `loginWithEmail`                   | `POST /login`                                                            | JSON `{email,password}`; sin headers explicitos                          | `token` o `access_token`; usuario en `user`, `usuario` o respuesta-raiz. Normaliza `displayName`/foto/rol                                                                                                                | `LoginComponent`; invocado. Backend **NO VERIFICADO**.                                |
| `sendPasswordReset`                | `POST /forgot-password`                                                  | JSON `{email}`; sin headers explicitos                                   | Ignora cuerpo; cualquier respuesta 2xx pone `passwordResetSent=true`                                                                                                                                                     | `ForgotPasswordComponent`; invocado. Backend **NO VERIFICADO**.                       |
| `updateUserProfile`                | `PUT /users/{id}`                                                        | JSON `{name, avatarBase64?}`; Authorization manual + interceptor         | Ignora respuesta; actualiza localStorage/signals con el nombre enviado y foto opcional                                                                                                                                   | `ProfileEditComponent`; invocado. Backend **NO VERIFICADO**.                          |
| `obtenerEncuestasDisponibles`      | `GET /surveys?userId={id}` (query omitida si no hay id)                  | `getOptions()`                                                           | Lista directa o `data`, `encuestas`, `items`. Mapea `id/surveyId/survey_id`, `titulo/title`, descripcion/description, status/estado, `completed`, totalQuestions/preguntas. Subtitulo/icono/fecha se inventan localmente | `AvailableSurveysComponent`; invocado al iniciar. Backend **NO VERIFICADO**.          |
| `obtenerTodasLasEncuestas`         | `GET /surveys`                                                           | `getOptions()`                                                           | Array directo o `data`/`encuestas`                                                                                                                                                                                       | Sin caller hallado. Backend **NO VERIFICADO**.                                        |
| `obtenerEncuestasAdmin`            | `GET /surveys?includeInactive=true`                                      | `getOptions()`                                                           | Array directo o `data`                                                                                                                                                                                                   | Sin caller hallado. Backend **NO VERIFICADO**.                                        |
| `enviarRespuestas`                 | `POST /surveys/{id}/responses`                                           | `getOptions()`; body construido por el flujo responder (ejemplo abajo)   | `any`; el caller usa solo exito/error                                                                                                                                                                                    | `SurveysComponent.finalizar`; invocado. Backend **NO VERIFICADO**.                    |
| `crearEncuesta`                    | `POST /surveys`                                                          | `getOptions()`; body backend mapeado (ejemplo abajo)                     | Tipado `Encuesta`; componente ignora contenido                                                                                                                                                                           | `CreateSurvey.save`, modo crear. Backend **NO VERIFICADO**.                           |
| `actualizarEncuesta`               | `PUT /surveys/{id}`                                                      | Igual que crear                                                          | Tipado `Encuesta`; componente ignora contenido                                                                                                                                                                           | `CreateSurvey.save`, modo editar. Backend **NO VERIFICADO**.                          |
| `listarEncuestas`                  | `GET /surveys?busqueda={}&estado={}`                                     | `getOptions()`; params solo si valor presente y estado distinto de TODOS | `Encuesta[]`; no adapta nombres                                                                                                                                                                                          | Sin caller hallado. Backend **NO VERIFICADO**.                                        |
| `obtenerEncuestaPorId`             | `GET /surveys/{id}`                                                      | `getOptions()`                                                           | Tipado `Encuesta`; el formulario lee `title`, `description`, `status`, `questions` backend                                                                                                                               | `CreateSurvey.cargarEncuesta`; invocado para editar/ver. Backend **NO VERIFICADO**.   |
| `obtenerEncuestaParaResponder`     | `GET /surveys/{id}`                                                      | `getOptions()`                                                           | Lee `surveyId`, `title`, `description`, `questions[]` con `questionId`, `questionText`, `questionType`, `isRequired`, `displayOrder`, `options[]` (`optionId`, `optionText`); convierte a forma de encuesta frontend     | `SurveysComponent.ngOnInit`; invocado. Backend **NO VERIFICADO**.                     |
| `publicarEncuesta`                 | `PATCH /surveys/{id}/publish`                                            | `getOptions()`; body `{}`                                                | Tipado `Encuesta`                                                                                                                                                                                                        | Sin caller hallado. Backend **NO VERIFICADO**.                                        |
| `desactivarEncuesta`               | `PATCH /surveys/{id}/deactivate`                                         | `getOptions()`; body `{}`                                                | Tipado `Encuesta`                                                                                                                                                                                                        | Sin caller hallado. Backend **NO VERIFICADO**.                                        |
| `listarEstudiantesQueRespondieron` | `GET /surveys/{id}/estudiantes`                                          | Sin options explicitas; interceptor si token                             | `EstudianteEncuestado[]`                                                                                                                                                                                                 | Solo comentario/propuesta en `SurveyResults`; no llamado. Backend **NO VERIFICADO**.  |
| `obtenerRespuestasEstudiante`      | `GET /surveys/{id}/estudiantes/{studentId}/respuestas?desde={}&hasta={}` | Sin options explicitas; interceptor si token                             | `RespuestaPregunta[]`                                                                                                                                                                                                    | Solo comentario/propuesta en `StudentAnswers`; no llamado. Backend **NO VERIFICADO**. |
| `getSurveyByQR`                    | `GET /surveys/qr/{surveyId}`                                             | Sin options explicitas; interceptor si token                             | Espera envoltorio `{data: Encuesta}`                                                                                                                                                                                     | Sin caller; no hay escaner conectado. Backend **NO VERIFICADO**.                      |

Fuente de metodos, headers, transformaciones y firmas: [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts). Callers: [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts), [surveys.ts user](../encuestas-ue/src/app/features/user/surveys/surveys.ts), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts), [profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts), [login.ts](../encuestas-ue/src/app/features/auth/login/login.ts), [register.ts](../encuestas-ue/src/app/features/auth/register/register.ts), [forgot-password.ts](../encuestas-ue/src/app/features/auth/forgot-password/forgot-password.ts).

### JSON que el cliente envia

Registro:

```json
{
  "name": "<nombre>",
  "email": "<correo>",
  "password": "<contrasena>",
  "status": 1
}
```

Login y recuperacion:

```json
{ "email": "<correo>", "password": "<contrasena>" }
```

```json
{ "email": "<correo>" }
```

Actualizacion de perfil (la foto solo se agrega si se selecciono):

```json
{ "name": "<nombre completo>", "avatarBase64": "data:image/jpeg;base64,..." }
```

La interfaz pide un solo nombre; el metodo suma `nombre` y una cadena de apellido vacia, por lo que el valor normalmente es el campo ingresado. La utilidad convierte imagen a JPEG con maximo lado 200 y calidad 0.7. [profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts), [imagen.util.ts](../encuestas-ue/src/app/shared/utils/imagen.util.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)

Crear/editar encuesta: el formulario arma primero `titulo`, `descripcion`, `estado` y `preguntas`. `aPayloadBackend()` envia `title`, `description`, `userId`, `questions`; **no envia `estado/status` de encuesta**. Solo incluye preguntas ACTIVAS; para `ESCALA` fabrica opciones "1".."5", para ABIERTA opciones vacias, para seleccion multiple usa las opciones de formulario. `questionType` se convierte a `Escala`, `Abierta` o `Seleccion Multiple`.

```json
{
  "title": "<titulo>",
  "description": "<descripcion>",
  "userId": 123,
  "questions": [
    {
      "questionText": "<pregunta>",
      "questionType": "Escala | Abierta | Seleccion Multiple",
      "isRequired": true,
      "displayOrder": 1,
      "options": [{ "optionText": "1", "displayOrder": 1 }]
    }
  ]
}
```

El objeto de ejemplo muestra la forma y una opcion de escala; el numero de opciones depende del tipo. `userId` conserva el tipo del valor `user.id ?? user.userId` encontrado en localStorage (el `123` del ejemplo es ilustrativo). La propiedad `estado` de pregunta y estado de encuesta no viajan. [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts)

Enviar respuestas:

```json
{
  "surveyId": 123,
  "userId": 123,
  "details": [
    { "questionId": 1, "optionId": 2 },
    { "questionId": 2, "responseText": "<texto libre>" }
  ]
}
```

Cada detalle incluye `questionId` y uno de `optionId`/`responseText`; la lista se arma desde el estado local. `surveyId` se convierte a numero y `userId` se lee de `user.id ?? user.userId` conservando el tipo (el `123` del ejemplo es ilustrativo). [surveys.ts user](../encuestas-ue/src/app/features/user/surveys/surveys.ts)

### Respuestas que el cliente presupone

Ejemplo de login compatible con los accesos actuales (no es evidencia del servidor):

```json
{
  "token": "<jwt>",
  "user": {
    "id": 123,
    "name": "Nombre",
    "email": "persona@ejemplo.test",
    "roleId": 2
  }
}
```

El formulario responder espera encuesta y preguntas en ingles/camelCase, por ejemplo `surveyId`, `title`, `description`, `questions`, `questionId`, `questionText`, `questionType`, `isRequired`, `options`, `optionId`, `optionText`. El endpoint admin de detalle esta tipado como `Encuesta` en español pero su cargador lee esos campos en ingles; la forma contractual del servidor sigue **NO VERIFICADO**. Para recuperar contrasena y registro no se inspecciona el cuerpo de exito. Para la mayoria de los endpoints el caller no utiliza el objeto de respuesta; el unico contrato concreto es el que el mapper consume.

## 5. Pantallas

| Pantalla/ruta                                                 | Proposito y origen de datos                                                                          | Servicios/acciones                                                                   | Carga, error y estado funcional                                                                                                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login `/login`                                                | Formulario reactivo; backend real para autenticar.                                                   | AuthService; mostrar/ocultar clave; navegar registro/recuperacion.                   | Spinner/error del servicio y alerta SweetAlert al exito.                                                                                                                             |
| Registro `/register`                                          | Formulario y validacion de confirmacion local; envio backend real.                                   | AuthService; alternar ambas claves.                                                  | Spinner/error; alerta de exito y redireccion a login.                                                                                                                                |
| Olvide contrasena `/forgot-password`                          | Solicita recuperacion al endpoint.                                                                   | AuthService; volver a login.                                                         | Spinner/error y confirmacion local cuando HTTP termina 2xx. El envio real de correo es **NO VERIFICADO**.                                                                            |
| Perfil `/admin/profile`, `/user/profile`                      | Lee usuario/foto/rol de AuthService restaurado desde localStorage; no hace GET de perfil.            | Enlace editar.                                                                       | Muestra cargando mientras `authReady`; estado de sesion ausente con enlace login.                                                                                                    |
| Editar perfil `/admin/profile/edit`, `/user/profile/edit`     | Nombre y foto local comprimida; PUT backend.                                                         | AuthService, utilidad de imagen; cancelar/guardar.                                   | Spinner, error y exito del PUT; fallo de lectura de imagen **NO VERIFICADO** en UI (no hay catch en `submit`).                                                                       |
| Layout/admin y usuario                                        | Shell compartido, menus segun URL, perfil, cierre de sesion.                                         | Logout; sidebar responsive.                                                          | Sin carga de datos. Menu user defectuoso por `routerLink` ubicado como texto en el HTML.                                                                                             |
| Dashboard admin `/admin/dashboard`                            | **DATOS FIJOS**: series, KPIs y preguntas escritas en TS.                                            | Filtro de fecha/seleccion local; tabs de pregunta.                                   | No carga ni presenta errores HTTP. `onSurveyChange` solo contiene TODO. Botones “Mas opciones” y “Ver todas las preguntas” no tienen manejador.                                      |
| Listado admin `/admin/surveys`                                | **DATOS FIJOS** en signal local (3 encuestas); no llama EncuestasService.                            | Filtra por fechas/estado; crear/ver/editar/resultados; genera y descarga QR PNG.     | Sin estado de carga/API. Fallo QR solo `console.error`; el modal queda sin mensaje de error.                                                                                         |
| Crear/editar/ver `/admin/surveys/create`, `/:id/edit`, `/:id` | Mixto: pantalla/carga y guardado usan backend; pregunta inicial y estado inicial son defaults.       | GET por id para editar/ver; POST/PUT al guardar; añadir/eliminar pregunta; cancelar. | `saving`, `errorMessage` y SweetAlert al error de carga. En modo view deshabilita formulario. No hay indicador de carga inicial; el boton Guardar no refleja `saved`.                |
| Resultados `/admin/surveys/:id/results`                       | **DATOS FIJOS**: nombre de encuesta y 3 estudiantes en signal local.                                 | Enlaces volver/ver respuestas; fechas no se filtran aqui.                            | Sin carga ni error, no invoca `listarEstudiantesQueRespondieron`.                                                                                                                    |
| Respuestas estudiante `/admin/surveys/:id/results/:studentId` | **DATOS FIJOS**: identidad y 3 respuestas; filtro fecha local.                                       | Volver y filtrar/limpiar fechas.                                                     | Sin carga/error; no invoca `obtenerRespuestasEstudiante`.                                                                                                                            |
| Encuestas disponibles `/user/available-surveys`               | **BACKEND REAL (cliente)**: GET `/surveys` transformado a tarjetas.                                  | Boton responder navega a ruta de respuesta; impide si `completada`.                  | No hay signal de carga ni estado visual de error; error solo `console.error`. Lista inicial vacia puede parecer lista sin resultados.                                                |
| Responder `/user/responder-encuesta/:id`                      | Mixto: encuesta y preguntas por GET; respuestas permanecen en memoria antes del POST.                | Seleccion, texto, anterior/siguiente y envio al ultimo paso.                         | Spinner mientras no haya preguntas; GET falla con SweetAlert pero conserva el estado cargando. POST muestra exito/error y vuelve al listado, no usa ruta completada.                 |
| Exito `/user/responder-encuesta/:id/completada`               | **DATOS FIJOS** para profesor y cantidad 10/10; la ruta existe pero el flujo actual no la abre.      | Enlace al listado.                                                                   | No espera parametro ni estado real del envio.                                                                                                                                        |
| QR admin                                                      | **BACKEND/servicio local real para generacion**: `qrcode` codifica URL de la app con id de encuesta. | Abrir/cerrar modal, generar y descargar PNG.                                         | `qrLoading`; excepcion solo consola. Es una URL `window.location.origin/user/responder-encuesta/{id}`.                                                                               |
| Escaner QR                                                    | No hay pantalla/componente/paquete de escaneo en el fuente actual.                                   | `getSurveyByQR()` esta definido, sin caller.                                         | **NO IMPLEMENTADO/NO VERIFICADO** en la UI actual.                                                                                                                                   |
| Preguntas admin y respuestas usuario                          | `Questions` y `Responses` solo muestran texto placeholder.                                           | Ninguna accion real; no estan en rutas.                                              | Sin carga/error. [questions.html](../encuestas-ue/src/app/features/admin/questions/questions.html), [responses.html](../encuestas-ue/src/app/features/user/responses/responses.html) |

Fuentes principales de la tabla: [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts), [dashboard.html](../encuestas-ue/src/app/features/admin/dashboard/dashboard.html), [admin surveys TS](../encuestas-ue/src/app/features/admin/surveys/surveys.ts), [admin surveys HTML](../encuestas-ue/src/app/features/admin/surveys/surveys.html), [create-survey TS](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts), [create-survey HTML](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.html), [available-surveys TS](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts), [available-surveys HTML](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.html), [user surveys TS](../encuestas-ue/src/app/features/user/surveys/surveys.ts), [user surveys HTML](../encuestas-ue/src/app/features/user/surveys/surveys.html), [survey results TS](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts), [student answers TS](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts), [survey success TS](../encuestas-ue/src/app/features/user/survey-success/survey-success.ts), [layout TS](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.ts), [layout HTML](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.html), [QR service](../encuestas-ue/src/app/core/services/qr.service.ts).

### Formulario de crear encuesta: tipos y modos

Los tipos de dominio son `ESCALA`, `ABIERTA`, `SELECCION_MULTIPLE` y el componente define opciones para escala 1-5, texto libre y opciones por linea. El FormGroup incluye `type`, `required`, `status`, `options`, y el mapper puede guardar los tres tipos. **Pero la plantilla actual no tiene selector de tipo ni controles de requerida/estado/opciones**: solo presenta input de texto, eliminar, añadir y guardar. Por tanto no aparecen campos condicionales por tipo y las preguntas nuevas mantienen el default `ESCALA`. No se puede afirmar que el usuario elija tipos en la UI. [pregunta.model.ts](../encuestas-ue/src/app/shared/models/pregunta.model.ts), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts), [create-survey.html](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.html)

Modos: `/admin/surveys/create` = crear; `/:id/edit` = editar; `/:id` lleva `data.mode='view'` y deshabilita el formulario. El cargador traduce `status` numerico igual a `1` a `PUBLICADA`; cualquier otro valor se convierte a `INACTIVA`, sin preservar `BORRADOR`. El serializer omite el estado de encuesta y los estados de preguntas. [admin.routes.ts](../encuestas-ue/src/app/features/admin/admin.routes.ts), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts), [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts)

## 6. Modelos e interfaces (`shared/models`)

| Tipo/interfaz                     | Campos declarados                                                                                                                                                         | Uso y diferencias observadas                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Encuesta`                        | `id:string`, `titulo:string`, `descripcion?:string`, `tipo:TipoEncuesta`, `profesor:Item`, `estado?:EstadoEncuestaAdmin`, `fechaCreacion?:string`, `preguntas:Pregunta[]` | Respuesta y formulario usuario; distinto del payload backend mapeado (`surveyId/title/description/questions`). `profesor` y `tipo` no se mapean desde ese DTO.                                          |
| `Pregunta`                        | `id`, `texto`, `tipo`, `enunciado`, `opciones?:string[]`, `requerida`, `displayOrder`, `estado`                                                                           | Encuesta y UI. La respuesta para contestar mapea opciones backend a objetos `{id,texto}`, no `string[]`; tipo backend usa etiquetas con inicial mayuscula/espacio, frontend union uppercase/underscore. |
| `RespuestaPregunta`               | `preguntaId`, `preguntaTexto`, `tipoPregunta`, `respuesta`, `fechaRespuesta`                                                                                              | Solo datos locales de `StudentAnswers`; servicio espera este tipo pero no se llama. Forma de campos del backend **NO VERIFICADO**.                                                                      |
| `Item`                            | `id`, `nombre`, `descripcion?`, `estado: 'Activo'                                                                                                                         | 'Inactivo'`, `categoria`                                                                                                                                                                                | Solo anidado como tipo de `Encuesta.profesor`; campos backend equivalentes **NO VERIFICADO**. |
| `TipoPregunta` / `EstadoPregunta` | Union `ESCALA                                                                                                                                                             | ABIERTA                                                                                                                                                                                                 | SELECCION_MULTIPLE`; `ACTIVA                                                                  | INACTIVA`                                                                                                                            | Formulario y respuesta local; traduccion backend en EncuestasService. |
| `TipoEncuesta`                    | `DOCENTE                                                                                                                                                                  | CURSO                                                                                                                                                                                                   | INSTITUCIONAL`                                                                                | Tipo de `Encuesta`; constante `TIPOS_ENCUESTA` declarada, no hay select visible que la use. Equivalencia servidor **NO VERIFICADO**. |
| `EstadoEncuestaAdmin`             | `BORRADOR                                                                                                                                                                 | PUBLICADA                                                                                                                                                                                               | INACTIVA`                                                                                     | Filtros y formulario admin. No coincide con status numerico leido por create-survey ni se envia en serializer.                       |
| `EncuestaDisponible`              | `id`, `titulo`, `subtitulo`, `iconoSubtitulo`, `estado`, `descripcion`, `totalPreguntas`, `fechaTexto`, `completada`                                                      | GET disponible. Solo una parte viene del backend; subtitulo, icono y fechaTexto son valores fijos generados por mapper.                                                                                 |
| `EstadoEncuesta`                  | `DISPONIBLE                                                                                                                                                               | PENDIENTE                                                                                                                                                                                               | COMPLETADO`                                                                                   | Estado derivado por mapper en lista user; no es una etiqueta backend directa.                                                        |
| `EstudianteEncuestado`            | `estudianteId`, `nombre`, `correo`, `fechaRespuesta`                                                                                                                      | Firma del servicio de resultados y arrays fijos de UI. Claves backend **NO VERIFICADO**.                                                                                                                |
| `EncuestaDashboard`               | `survey_id`, `title`, `created_at`, `close_date`, `status`                                                                                                                | Solo dashboard con datos estaticos; estilo snake_case difiere de modelos `Encuesta` y del payload `title/description`.                                                                                  |

Definiciones: [encuesta.models.ts](../encuestas-ue/src/app/shared/models/encuesta.models.ts), [pregunta.model.ts](../encuestas-ue/src/app/shared/models/pregunta.model.ts), [respuesta-pregunta.model.ts](../encuestas-ue/src/app/shared/models/respuesta-pregunta.model.ts), [item.model.ts](../encuestas-ue/src/app/shared/models/item.model.ts), [tipo-encuesta.model.ts](../encuestas-ue/src/app/shared/models/tipo-encuesta.model.ts), [estado-encuesta-admin.model.ts](../encuestas-ue/src/app/shared/models/estado-encuesta-admin.model.ts), [encuesta-disponible.model.ts](../encuestas-ue/src/app/shared/models/encuesta-disponible.model.ts), [estudiante-encuestado.model.ts](../encuestas-ue/src/app/shared/models/estudiante-encuestado.model.ts), [encuesta-dashboard.model.ts](../encuestas-ue/src/app/shared/models/encuesta-dashboard.model.ts). Usos y transformaciones: [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts), [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts).

## 7. Contrato que espera el frontend

Resumen comparativo por recurso (detalles HTTP/headers y JSON completo en seccion 4):

| Recurso esperado       | Solicitud esperada por el cliente                                                                           | Campos de respuesta que consume o presupone                                                                                                           | Estado                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Login                  | `POST /api/login` `{email,password}`                                                                        | token/access_token y user/usuario/raiz; usuario con `id` o `userId`, `roleId`/`role_id`/`rol`, `name`, `email`, avatar opcional                       | Endpoint y campos server **NO VERIFICADO**                      |
| Registro               | `POST /api/users` `{name,email,password,status:1}`                                                          | cuerpo ignorado                                                                                                                                       | **NO VERIFICADO**                                               |
| Recuperar clave        | `POST /api/forgot-password` `{email}`                                                                       | cuerpo ignorado; 2xx = enviado                                                                                                                        | **NO VERIFICADO**                                               |
| Actualizar perfil      | `PUT /api/users/{id}` `{name,avatarBase64?}`                                                                | cuerpo ignorado                                                                                                                                       | **NO VERIFICADO**                                               |
| Listar encuestas       | `GET /api/surveys` con variantes `userId`, `includeInactive`, `busqueda`, `estado`                          | array, `data`, `encuestas` y para disponibles tambien `items`; id/title/titulo, status/estado, descripciones, completed, preguntas u `totalQuestions` | Hay varios metodos con parsers distintos; **NO VERIFICADO**     |
| Detalle encuesta       | `GET /api/surveys/{id}`                                                                                     | formulario/admin: `title`, `description`, `status`, `questions`; responder: `surveyId`, `title`, `description`, `questions[]` y opciones camelCase    | Inconsistencia de DTO con `Encuesta` español; **NO VERIFICADO** |
| Crear/editar           | `POST /api/surveys`, `PUT /api/surveys/{id}` con `{title,description,userId,questions}`                     | pregunta camelCase y opciones como `{optionText,displayOrder}`; estado no incluido                                                                    | **NO VERIFICADO**                                               |
| Enviar respuestas      | `POST /api/surveys/{id}/responses` con `{surveyId,userId,details:[{questionId,optionId? ,responseText?}]}`  | cualquier respuesta 2xx cuenta como exito                                                                                                             | **NO VERIFICADO**                                               |
| Publicar/desactivar    | `PATCH /api/surveys/{id}/publish` y `/deactivate`, body `{}`                                                | interface `Encuesta`                                                                                                                                  | Metodos definidos, no llamados; **NO VERIFICADO**               |
| Resultados por persona | `GET /api/surveys/{id}/estudiantes`; `GET /api/surveys/{id}/estudiantes/{studentId}/respuestas?desde&hasta` | `EstudianteEncuestado[]`; `RespuestaPregunta[]`                                                                                                       | UI no conectada; **NO VERIFICADO**                              |
| Consulta QR            | `GET /api/surveys/qr/{surveyId}`                                                                            | `{data: Encuesta}`                                                                                                                                    | Metodo sin caller/escaneo; **NO VERIFICADO**                    |

No se inspecciono un servidor Node/Express ni su documentacion en el workspace, asi que no es posible confirmar que estos endpoints existan, que las respuestas se parezcan a las interfaces o que `roleId=1/2` sea el contrato efectivo. En el cliente, `1=admin` y `2=usuario` son convenciones documentadas en AuthService, pero solo el rol 1 afecta la guarda admin; `2` no se comprueba en una guarda user. [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), [auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts)

## 8. Datos de mentira y codigo muerto

### Datos de UI escritos a mano

| Archivo                                                                                                                                                                                                                                                                      | Datos fijos observados                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts)                                                                                                                                                                                                | 3 encuestas (IDs 101-103, titulos, fechas y estados); KPI `{totalRespuestas:80,promedio:4.2,participacion:85}`; 5 preguntas con promedios 4.6, 4.2, 3.8, 4.5, 3.2; cada pregunta contiene 5 valores/porcentajes de barras y un `highlight`. El eje usa `[1,2,3,4,5]`. |
| [admin surveys TS](../encuestas-ue/src/app/features/admin/surveys/surveys.ts)                                                                                                                                                                                                | 3 registros `survey-001..003`, nombres, descripciones, docentes, conteos 10/8/12, estados y fechas agosto 2026. Todo el listado/filtro es local.                                                                                                                      |
| [survey-results.ts](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts)                                                                                                                                                                 | Nombre fijo “Evaluación Docente 2026-2” y 3 estudiantes con ids, nombres, correos y fechas 24-25 agosto 2026.                                                                                                                                                         |
| [student-answers.ts](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts)                                                                                                                                              | Estudiante “Laura Ramírez”, correo fijo y 3 respuestas ejemplo: escala `5`, texto libre y opcion “Siempre”, todas con fecha 2026-08-24.                                                                                                                               |
| [survey-success.ts](../encuestas-ue/src/app/features/user/survey-success/survey-success.ts)                                                                                                                                                                                  | Profesor “Carlos Martínez”; total y respondidas `10`.                                                                                                                                                                                                                 |
| [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts)                                                                                                                                                                                   | Defaults del formulario: encuesta `BORRADOR`; pregunta vacia, tipo `ESCALA`, requerida y `ACTIVA`, opciones vacias. No son respuestas de backend.                                                                                                                     |
| [pregunta.model.ts](../encuestas-ue/src/app/shared/models/pregunta.model.ts), [estado-encuesta-admin.model.ts](../encuestas-ue/src/app/shared/models/estado-encuesta-admin.model.ts), [tipo-encuesta.model.ts](../encuestas-ue/src/app/shared/models/tipo-encuesta.model.ts) | Catalogos estaticos de tipos/estados de UI; son enumeraciones, no datos de encuestas reales.                                                                                                                                                                          |
| [surveys.ts user](../encuestas-ue/src/app/features/user/surveys/surveys.ts)                                                                                                                                                                                                  | Opciones de calificacion `[1,2,3,4,5]`; el template renderiza opciones recibidas de la encuesta y este arreglo no se usa en el flujo.                                                                                                                                 |

En cambio, `AvailableSurveysComponent` y `SurveysComponent` no tienen lista de encuestas/preguntas demo como fuente normal: consumen el servicio. `SurveysComponent` inicia con textos “Cargando...” solo como estado inicial. [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts), [user surveys TS](../encuestas-ue/src/app/features/user/surveys/surveys.ts)

### Codigo sin conexion, tareas y acciones

- `obtenerTodasLasEncuestas`, `obtenerEncuestasAdmin`, `listarEncuestas`, `publicarEncuesta`, `desactivarEncuesta`, `listarEstudiantesQueRespondieron`, `obtenerRespuestasEstudiante` y `getSurveyByQR` existen en el servicio, pero no se encontro caller funcional. [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts)
- `onSurveyChange()` conserva el TODO para cargar datos reales; `dashboard.ts` es la unica coincidencia funcional TODO encontrada. Firebase esta en dependencias, pero no hay servicio Firebase, llamadas Firebase ni traducciones de errores Firebase en `src/app`. [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts), [package.json](../encuestas-ue/package.json)
- `Questions` y `Responses` son placeholders sin ruta. `TIPOS_ENCUESTA` esta declarado, pero no hay selector de ese tipo en la plantilla del formulario. [questions.ts](../encuestas-ue/src/app/features/admin/questions/questions.ts), [responses.ts](../encuestas-ue/src/app/features/user/responses/responses.ts), [tipo-encuesta.model.ts](../encuestas-ue/src/app/shared/models/tipo-encuesta.model.ts), [create-survey.html](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.html)
- Botones sin manejador: “Mas opciones” y “Ver todas las preguntas” del dashboard. Los controles visibles del CRUD, login, registro, perfil y flujo de respuesta tienen manejadores/enlaces. [dashboard.html](../encuestas-ue/src/app/features/admin/dashboard/dashboard.html)
- `console.log` de depuracion: respuesta cruda de `GET /surveys` en `obtenerEncuestasDisponibles`. `console.error` aparece en registro, perfil, alta/edicion, QR, carga/envio de encuestas y carga del listado user; esos errores no siempre se presentan en UI. [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts), [admin surveys TS](../encuestas-ue/src/app/features/admin/surveys/surveys.ts), [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts), [user surveys TS](../encuestas-ue/src/app/features/user/surveys/surveys.ts)
- No se detectaron imports sin uso mediante los diagnosticos de editor disponibles; `noUnusedLocals` no esta activado explicitamente en [tsconfig.json](../encuestas-ue/tsconfig.json). Campo no usado visible: `opcionesCalificacion` en el componente de responder. No se ejecutaron pruebas automatizadas.
- La guia heredada [GUIA_INTEGRACION_BACKEND_ZULLIE.md](../encuestas-ue/src/app/docs/GUIA_INTEGRACION_BACKEND_ZULLIE.md) describe un `features/user/scan-qr` con `jsqr`; ese componente/paquete no existe en el arbol actual. Debe tratarse como informacion obsoleta respecto al codigo leido, no como funcion implementada.

## 9. Dashboard: datos necesarios para hacerlo real

### Estado actual comprobado

El componente define `Question {id,label,avg,bars}` y `Bar {label,value,pct,highlight}`, 5 preguntas de muestra y un signal plano de KPIs con 80 respuestas, promedio 4.2 y 85% participacion. El selector de fecha compara igualdad con `created_at`; la encuesta seleccionada no filtra resultados: `onSurveyChange()` solo tiene un TODO. No existe llamada a EncuestasService. [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts), [dashboard.html](../encuestas-ue/src/app/features/admin/dashboard/dashboard.html), [encuesta-dashboard.model.ts](../encuestas-ue/src/app/shared/models/encuesta-dashboard.model.ts)

### Contrato de datos necesario (propuesta, NO implementado)

Para cumplir los requisitos indicados, al seleccionar encuesta y filtrar fechas el dashboard necesita del backend, como minimo:

1. Identidad/metadatos de encuesta: id, titulo, fecha de creacion/cierre y estado para poblar filtros.
2. `totalResponses` de esa encuesta y rango seleccionado.
3. `totalRole2Users` (conteo de usuarios cuyo rol es 2), para contexto de usuarios; no calcular ni mostrar porcentaje de participacion.
4. Por cada pregunta: id, texto, tipo, orden. Si es ESCALA: promedio y conteos para cada puntuacion 1, 2, 3, 4, 5, incluyendo ceros. Si es SELECCION_MULTIPLE: conteo por opcion/id y etiqueta. Si es ABIERTA: lista de textos de respuesta (idealmente con fecha/id si se requieren filtros).
5. Filtro coherente por encuesta y fecha aplicado al conjunto de respuestas/KPIs, no solo al arreglo local de encuestas.

Ejemplo de forma de datos requerida; es una especificacion para comparar, **no** una respuesta backend verificada:

```json
{
  "surveyId": 123,
  "totalResponses": 80,
  "totalRole2Users": 240,
  "questions": [
    {
      "questionId": 1,
      "questionText": "Pregunta escala",
      "questionType": "ESCALA",
      "average": 4.2,
      "distribution": { "1": 2, "2": 4, "3": 10, "4": 28, "5": 36 }
    },
    {
      "questionId": 2,
      "questionText": "Pregunta de opciones",
      "questionType": "SELECCION_MULTIPLE",
      "counts": [{ "optionId": 4, "optionText": "Opcion A", "count": 21 }]
    },
    {
      "questionId": 3,
      "questionText": "Pregunta abierta",
      "questionType": "ABIERTA",
      "answers": [{ "responseText": "Texto recibido" }]
    }
  ]
}
```

La distribucion de escala se expresa sobre respuestas, con suma igual a respuestas validas de esa pregunta. En seleccion multiple los conteos pueden sumar mas que personas si se permite marcar varias opciones; la semantica exacta es **NO VERIFICADO**. `totalRole2Users` deberia provenir de conteo backend/autorizado, no del frontend ni de la muestra actual. Los campos de este ejemplo no existen aun en el modelo `Question/Bar` del componente.

El requisito solicitado excluye porcentaje de participacion. El codigo actual si renderiza el KPI `% PARTICIPACION` con valor fijo 85; por tanto hoy no satisface ese requisito. Tampoco presenta graficas/series de respuestas abiertas o conteos de seleccion multiple. [dashboard.html](../encuestas-ue/src/app/features/admin/dashboard/dashboard.html), [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts)

## 10. Problemas conocidos

1. No se puede comparar con el contrato real del backend: no hay backend ni `BACKEND.md` disponible; existencia y forma de los endpoints quedan **NO VERIFICADO**.
2. El menu user tiene `routerLink` fuera de la etiqueta de apertura; el item no navega. [app-layout.html](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.html)
3. `adminGuard` esta aplicado, pero acepta un unico caso estricto (`roleId` numero 1); AuthService acepta tambien `role_id`/`rol`, causando posibles rechazos tras login/restauracion. [auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)
4. Dashboard, lista admin, resultados y respuestas individuales son demos estaticas; la lista admin no invoca el servicio. [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts), [admin surveys TS](../encuestas-ue/src/app/features/admin/surveys/surveys.ts), [survey-results.ts](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts), [student-answers.ts](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts)
5. Crear encuesta no deja elegir tipo ni configurar opciones en plantilla. Ademas, guarda omitiendo el estado de encuesta/pregunta y solo serializa preguntas activas; ver/editar transforma todo estado no numerico 1 a INACTIVA. [create-survey.html](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.html), [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts), [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts)
6. Interfaces españolas (`Encuesta`, `Pregunta`) no representan literalmente el DTO ingles consumido (`title`, `questionText`, `options` objeto). `obtenerEncuestaParaResponder` convierte parcialmente; el endpoint de detalle admin lee campos ingleses sin un adaptador tipado. [encuesta.models.ts](../encuestas-ue/src/app/shared/models/encuesta.models.ts), [pregunta.model.ts](../encuestas-ue/src/app/shared/models/pregunta.model.ts), [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts)
7. Flujo de respuesta no navega a la pantalla `/completada`; la pantalla de exito muestra profesor/cantidades hardcodeados. [user surveys TS](../encuestas-ue/src/app/features/user/surveys/surveys.ts), [survey-success.ts](../encuestas-ue/src/app/features/user/survey-success/survey-success.ts)
8. Componentes de resultados no llaman los metodos del servicio correspondientes; el servicio espera formas que coinciden con interfaces frontend no verificadas frente al backend. [survey-results.ts](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts), [student-answers.ts](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts), [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts)
9. No hay escaner QR; la guia de integracion afirma que habia uno, pero el componente y `jsqr` no estan en las fuentes actuales. La generacion usa IDs de la lista demo y `window.location.origin`. [admin surveys TS](../encuestas-ue/src/app/features/admin/surveys/surveys.ts), [GUIA_INTEGRACION_BACKEND_ZULLIE.md](../encuestas-ue/src/app/docs/GUIA_INTEGRACION_BACKEND_ZULLIE.md)
10. `environment.production` esta a false incluso para environment de build production; `devForceRole` no se usa. No hay bypass activo con los valores actuales, pero la bandera production no describe el build. [environment.ts](../encuestas-ue/src/environment/environment.ts), [environment.development.ts](../encuestas-ue/src/environment/environment.development.ts), [angular.json](../encuestas-ue/angular.json)
11. Falta estado de carga/error en varias pantallas: lista user reporta errores solo a consola; errores de QR no tienen mensaje visible; al fallar el GET de respuesta queda vista en carga. [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts), [admin surveys TS](../encuestas-ue/src/app/features/admin/surveys/surveys.ts), [user surveys TS](../encuestas-ue/src/app/features/user/surveys/surveys.ts)
12. Logout no vacia explicitamente `photoBase64`; la actualizacion de foto/nombre y manejo de archivo pueden dejar estado visual residual o errores no capturados. Resultado en una sesion posterior **NO VERIFICADO**. [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), [profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts)

## Resumen en 10 lineas

1. Angular Core 22.1.3; standalone y signals se usan, y el interceptor HTTP esta registrado.
2. API base configurada: `http://localhost:3001/api`; los valores dev y production son identicos.
3. `authGuard` protege usuario/admin; `adminGuard` si esta aplicado, pero valida solo `roleId === 1` numerico.
4. Sesion guarda `token` y `user` en localStorage; login/registro/perfil/recuperacion llaman REST desde AuthService.
5. El menu user esta roto por un `routerLink` escrito fuera del elemento `<a>`.
6. Lista admin, dashboard y pantallas de resultados contienen datos fijos; lista de encuestas user y respuesta individual si llaman backend.
7. El formulario de encuesta no expone el selector Escala/Abierta/Selección múltiple ni sus campos de opciones.
8. El servicio define endpoints de CRUD/resultados/QR sin caller; publicar/desactivar y resultados no estan conectados a UI.
9. QR se genera como URL local; no existe escaner en el codigo actual y la guia de integracion parece desactualizada.
10. **NO VERIFICADO:** existencia/respuestas de cualquier endpoint y contrato Node/Express; no hay backend ni `BACKEND.md` en el workspace disponible.
