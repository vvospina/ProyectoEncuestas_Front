# Frontend explicado: Encuestas UE

Documento de apoyo para la sustentación, redactado a partir del código actual de `encuestas-ue`. Las referencias apuntan a los archivos y nombran el método relevante para ubicar cada explicación. Cuando una afirmación depende del servidor y el servidor no está en este workspace, se marca como **NO VERIFICADO**: aquí solo se puede comprobar qué solicitud construye el frontend y qué respuesta espera.

## 1. Mapa general del proyecto

### Árbol comentado

```text
ProyectoEncuestas_Front/
|-- docs/                         Documentación del frontend y su explicación.
|-- encuestas-ue/
|   |-- src/
|   |   |-- app/
|   |   |   |-- core/
|   |   |   |   |-- auth/         Sesión, guards de rutas e interceptor HTTP.
|   |   |   |   `-- services/     Acceso a encuestas y generación de QR.
|   |   |   |-- features/
|   |   |   |   |-- auth/         Registro, inicio/cierre de sesión y recuperación.
|   |   |   |   |-- admin/        Dashboard, administración de encuestas y resultados.
|   |   |   |   |-- profile/      Vista y edición de perfil compartidas por roles.
|   |   |   |   `-- user/         Encuestas disponibles, respuesta y confirmación.
|   |   |   |-- shared/
|   |   |   |   |-- layout/       Estructura común: menú lateral, barra superior y outlet.
|   |   |   |   |-- models/       Tipos e interfaces de datos del frontend.
|   |   |   |   `-- utils/        Funciones reutilizables, aquí compresión de imagen.
|   |   |   |-- app.config.ts     Providers globales: router, HTTP e interceptor.
|   |   |   `-- app.routes.ts     Rutas de nivel superior y protecciones.
|   |   |-- environment/          Configuración, incluida la URL de API.
|   |   |-- public/img/           Imágenes públicas, por ejemplo el logo.
|   |   |-- main.ts               Punto de arranque Angular.
|   |   `-- styles.scss           Estilos globales.
|   |-- android/                  Proyecto nativo Android generado con Capacitor.
|   |-- angular.json              Configuración de build, serve y reemplazo de entorno.
|   `-- package.json              Dependencias y comandos npm.
```

La separación entre `core`, `features` y `shared` se ve en las importaciones y responsabilidades de [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts), los módulos de [features](../encuestas-ue/src/app/features) y los [modelos compartidos](../encuestas-ue/src/app/shared/models). Las rutas se conectan desde [app.routes.ts](../encuestas-ue/src/app/app.routes.ts), [admin.routes.ts](../encuestas-ue/src/app/features/admin/admin.routes.ts) y [user.routes.ts](../encuestas-ue/src/app/features/user/user.routes.ts). El prefijo `src/environment` es el que realmente importa el código; equivalencias adicionales con configuraciones de despliegue: **NO VERIFICADO**.

**Componente standalone.** Es un componente Angular que puede declarar sus propias dependencias de plantilla e instalarse directamente en una ruta, sin que un `NgModule` lo tenga que declarar. En este proyecto las rutas usan `loadComponent` o cargan árboles de rutas de forma diferida; ejemplos: `LoginComponent` en [login.ts](../encuestas-ue/src/app/features/auth/login/login.ts) y `CreateSurvey` en [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts).

**Signal.** Es una variable reactiva de Angular: se lee llamándola como función (`loading()`) y se cambia con `.set()` o `.update()`. Si una plantilla la lee, Angular puede actualizar esa parte de la pantalla cuando cambia; ejemplos: `AuthService.loading` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts) y `sidebarOpen` en [app-layout.ts](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.ts).

### Todas las rutas

Las rutas hijas de `/admin` comparten `AppLayout`, `authGuard` y `adminGuard`; las hijas de `/user` comparten `AppLayout` y `authGuard`. `loadComponent`/`loadChildren` permite cargar esas partes cuando se navega hacia ellas. Fuentes: [app.routes.ts](../encuestas-ue/src/app/app.routes.ts), [admin.routes.ts](../encuestas-ue/src/app/features/admin/admin.routes.ts), [user.routes.ts](../encuestas-ue/src/app/features/user/user.routes.ts).

| Ruta | Componente o destino | Qué hace |
|---|---|---|
| `/` | Redirección a `/login` | Envía la ruta raíz a inicio de sesión. |
| `/login` | `LoginComponent` | Recibe correo y contraseña e inicia sesión. |
| `/session-closed` | `SessionClosedComponent` | Muestra la pantalla posterior al cierre de sesión. |
| `/register` | `RegisterComponent` | Registra una cuenta nueva. |
| `/forgot-password` | `ForgotPasswordComponent` | Solicita por correo el enlace para recuperar contraseña. |
| `/reset-password` | `ResetPasswordComponent` | Lee `?token=...` y envía una contraseña nueva. |
| `/admin` | Redirección a `/admin/dashboard` | Abre el área administrativa dentro del layout. |
| `/admin/profile` | `ProfileComponent` | Muestra los datos del perfil de administrador guardados en la sesión local. |
| `/admin/profile/edit` | `ProfileEditComponent` | Edita el nombre y la foto del administrador. |
| `/admin/dashboard` | `Dashboard` | Permite consultar métricas por encuesta y fecha. |
| `/admin/surveys` | `Surveys` | Lista, filtra y permite abrir acciones para encuestas; genera QR. |
| `/admin/surveys/create` | `CreateSurvey` | Crea una encuesta. |
| `/admin/surveys/:id/edit` | `CreateSurvey` | Carga una encuesta existente para modificarla. |
| `/admin/surveys/:id` | `CreateSurvey` en modo `view` | Muestra una encuesta sin permitir editarla. |
| `/admin/surveys/:id/results` | `SurveyResults` | Lista estudiantes que respondieron la encuesta. |
| `/admin/surveys/:id/results/:studentId` | `StudentAnswers` | Muestra y filtra respuestas asociadas a un estudiante. |
| `/user` | Redirección a `/user/available-surveys` | Abre la sección de encuestas del usuario. |
| `/user/profile` | `ProfileComponent` | Muestra el perfil de usuario. |
| `/user/profile/edit` | `ProfileEditComponent` | Edita el nombre y la foto de usuario. |
| `/user/available-surveys` | `AvailableSurveysComponent` | Lista encuestas disponibles e incorpora el escáner QR. |
| `/user/responder-encuesta/:id` | `SurveysComponent` | Presenta las preguntas y envía las respuestas. |
| `/user/responder-encuesta/:id/completada` | `SurveySuccess` | Muestra la confirmación luego del envío exitoso. |
| `**` | Redirección a `/login` | Envía cualquier URL no reconocida al login. |

La ruta `reset-password` no exige sesión; admin y user sí. Hay componentes placeholder sin ruta (`Questions`, `Responses`), indicados en la sección 3.

## 2. Flujos completos, paso a paso

### Registro de una cuenta

1. En `/register`, la plantilla envía el formulario al método `submit()` de `RegisterComponent`. Ese método valida nombre, correo, clave y que ambas claves coincidan mediante `passwordsIgualesValidator`; si hay errores, marca campos como tocados y no llama al servicio. Véanse `form`, `submit()` y `confirmarPasswordTieneError` en [register.ts](../encuestas-ue/src/app/features/auth/register/register.ts), y el enlace `(ngSubmit)` en [register.html](../encuestas-ue/src/app/features/auth/register/register.html).
2. Si es válido, `submit()` pasa nombre/correo/clave a `AuthService.registerWithEmail()`. Este arma `{ name, email, password, status: 1 }` y hace `POST ${apiUrl}/users`, donde `apiUrl` termina en `/api`. La URL final configurada es `http://localhost:3001/api/users`. Véanse `registerWithEmail()` y `RegisterRequest` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), y [environment.ts](../encuestas-ue/src/environment/environment.ts).
3. Si el servidor responde sin error, el servicio muestra SweetAlert y, tras 1.5 segundos, navega a `/login`; no inicia sesión automáticamente. En error escribe `errorMessage`, que la plantilla presenta. El envío real y la persistencia en base de datos son **NO VERIFICADO** sin el backend.

### Inicio de sesión y selección del área

1. El usuario envía el formulario y `LoginComponent.submit()` valida correo y clave antes de llamar `AuthService.loginWithEmail(email, password)`. El control de mostrar/ocultar solo alterna la visibilidad, no cambia el valor. Véanse `submit()` y `alternarPassword()` en [login.ts](../encuestas-ue/src/app/features/auth/login/login.ts) y el `(ngSubmit)` de [login.html](../encuestas-ue/src/app/features/auth/login/login.html).
2. `loginWithEmail()` envía `POST /api/login` con `{ email, password }`. Espera que el token venga como `token` o `access_token`; busca el usuario en `user`, `usuario` o en la respuesta completa. Véase `loginWithEmail()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts).
3. `guardarSesion()` normaliza `displayName`, persiste token y usuario en `localStorage`, actualiza signals y calcula el rol. Para el estado global considera administrador cuando `Number(roleId ?? role_id) === 1` o `rol === 'Administrador'`; véanse `guardarSesion()` y `normalizarUsuario()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts).
4. Después del aviso de bienvenida, `afterLogin()` navega a `/admin/dashboard` si `userRole()` es `ADMIN`; en cualquier otro caso, a `/user/available-surveys`. El backend y la forma real de su respuesta son **NO VERIFICADO**.

### Recuperar y cambiar contraseña

1. Desde login se entra a `/forgot-password`. `ForgotPasswordComponent.submit()` valida el correo y llama `AuthService.sendPasswordReset(email)`. El servicio envía `POST /api/forgot-password` con `{ email }`; si hay respuesta HTTP exitosa pone `passwordResetSent=true`, y la plantilla reemplaza el formulario por el mensaje de revisar el correo. Véanse [forgot-password.ts](../encuestas-ue/src/app/features/auth/forgot-password/forgot-password.ts), `sendPasswordReset()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts) y [forgot-password.html](../encuestas-ue/src/app/features/auth/forgot-password/forgot-password.html). Que realmente se envíe un correo/enlace es **NO VERIFICADO**.
2. El enlace debe abrir `/reset-password?token=...`. En `ngOnInit()`, `ResetPasswordComponent` obtiene el token con `ActivatedRoute.snapshot.queryParamMap.get('token')`; si no está, la plantilla muestra enlace inválido y no presenta el formulario. Véanse `ngOnInit()` en [reset-password.ts](../encuestas-ue/src/app/features/auth/reset-password/reset-password.ts) y [reset-password.html](../encuestas-ue/src/app/features/auth/reset-password/reset-password.html).
3. Al enviar, `submit()` valida longitud mínima de seis caracteres y existencia del token; luego `AuthService.resetPasswordConfirm()` manda `POST /api/reset-password` con `{ token, newPassword }`. En éxito muestra confirmación y navega a login; en error actualiza `errorMessage`. La validez/expiración del token y el cambio efectivo en el servidor son **NO VERIFICADO**. Véanse `submit()` en [reset-password.ts](../encuestas-ue/src/app/features/auth/reset-password/reset-password.ts) y `resetPasswordConfirm()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts).

### Ver y editar perfil, incluida la foto

1. `ProfileComponent` toma nombre, correo, rol y foto de `AuthService.currentUser`, `userRole` y `photoBase64`; no hace una petición GET de perfil. El enlace de edición elige `/admin/profile/edit` o `/user/profile/edit` mirando si la URL empieza con `/admin`. Véanse `nombre` y `editProfilePath` en [profile.ts](../encuestas-ue/src/app/features/profile/view/profile.ts) y la plantilla [profile.html](../encuestas-ue/src/app/features/profile/view/profile.html).
2. Al entrar a editar, el constructor de `ProfileEditComponent` precarga el nombre y limpia signals de errores/éxito. Al seleccionar un archivo, `onFotoSeleccionada()` guarda el `File` y crea una URL temporal para la vista previa. Véanse constructor y `onFotoSeleccionada()` en [profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts), y el input file en [profile-edit.html](../encuestas-ue/src/app/features/profile/edit/profile-edit.html).
3. `submit()` valida el formulario. Si hay foto, llama `comprimirImagenABase64()`: lee el archivo, lo dibuja en un canvas con lado máximo 200 y produce JPEG Base64 con calidad 0.7. Después invoca `AuthService.updateUserProfile(nombre.trim(), '', fotoBase64)`. Véanse `submit()` en [profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts) y [imagen.util.ts](../encuestas-ue/src/app/shared/utils/imagen.util.ts).
4. El servicio concatena nombre y apellido vacío, toma `id` o `userId` de la sesión y envía `PUT /api/users/{id}` con `{ name, avatarBase64? }`. Si sale bien, actualiza `localStorage.user`, `currentUser`, la foto y el indicador de éxito; la vista del perfil puede reflejar esos valores al volver. Véase `updateUserProfile()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts). La aceptación de Base64 y persistencia real del cambio son **NO VERIFICADO**.

### Ver encuestas disponibles y responder una

1. Al abrir `/user/available-surveys`, `AvailableSurveysComponent.ngOnInit()` llama `cargarEncuestasReales()`, que solicita al servicio `obtenerEncuestasDisponibles()`. Este lee el ID de usuario local y hace `GET /api/surveys?userId=...` si lo tiene; luego adapta la respuesta a `EncuestaDisponible`. El componente guarda la lista en `encuestas`. Véanse `ngOnInit()`/`cargarEncuestasReales()` en [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts) y `obtenerEncuestasDisponibles()` en [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts).
2. Al presionar “Responder”, `responderEncuesta(id)` bloquea las ya completadas y, para las demás, navega a `/user/responder-encuesta/:id`. Véanse [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts) y el `(click)` de [available-surveys.html](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.html).
3. `SurveysComponent.ngOnInit()` lee el id de la URL mediante `Object.values(route.snapshot.params)[0]` y solicita `obtenerEncuestaParaResponder(id)`. El servicio hace `GET /api/surveys/{id}` y traduce `surveyId/title/questions/questionId/questionText/questionType/options` a los nombres que usa la pantalla. Véanse `ngOnInit()` en [surveys.ts (usuario)](../encuestas-ue/src/app/features/user/surveys/surveys.ts) y `obtenerEncuestaParaResponder()` en [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts).
4. La pantalla decide visualmente entre opciones y texto abierto por si la pregunta tiene `opciones`. `seleccionarCalificacion()` guarda un ID de opción; para `Seleccion Multiple` agrega o quita el ID en un arreglo sin borrar los demás, y para otros tipos con opciones reemplaza el arreglo por una sola opción. `actualizarTexto()` guarda texto abierto por id de pregunta. Véanse esos métodos y `preguntaActual` en [surveys.ts (usuario)](../encuestas-ue/src/app/features/user/surveys/surveys.ts) y las ramas de plantilla de [surveys.html (usuario)](../encuestas-ue/src/app/features/user/surveys/surveys.html).
5. `puedeContinuar` permite avanzar si la pregunta no es requerida o tiene respuesta; `finalizar()` vuelve a revisar todas las obligatorias. Para una escala crea un detalle `{ questionId, optionId }`; si se marcaron varias opciones, agrega un detalle por opción; para respuesta abierta crea `{ questionId, responseText }`. Finalmente envía `{ surveyId, userId, details }` mediante `enviarRespuestas()`, que hace `POST /api/surveys/{id}/responses`. Véanse `puedeContinuar()`, `finalizar()` en [surveys.ts (usuario)](../encuestas-ue/src/app/features/user/surveys/surveys.ts) y `enviarRespuestas()` en [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts).
6. En éxito, `finalizar()` muestra la notificación y navega a `/user/responder-encuesta/:id/completada?total=...`. `SurveySuccess.ngOnInit()` usa ese query param para mostrar el total sin otra llamada; si falta, vuelve a pedir la encuesta. Véanse [surveys.ts (usuario)](../encuestas-ue/src/app/features/user/surveys/surveys.ts) y [survey-success.ts](../encuestas-ue/src/app/features/user/survey-success/survey-success.ts). El registro real y el contrato del POST son **NO VERIFICADO**.

### Un administrador crea, ve y edita encuestas

1. En `/admin/surveys`, `Surveys.ngOnInit()` llama `cargarEncuestas()`. La pantalla pide `obtenerEncuestasAdmin()` (`GET /api/surveys?includeInactive=true`), adapta los resultados a su tipo local `Survey` y permite filtrar estado/fechas en el navegador. Véanse [surveys.ts (admin)](../encuestas-ue/src/app/features/admin/surveys/surveys.ts) y `obtenerEncuestasAdmin()` en [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts).
2. “Crear encuesta” abre `/admin/surveys/create`. `CreateSurvey` construye un formulario reactivo con título, descripción, estado y un `FormArray` de preguntas. Cada pregunta tiene texto, tipo, requerida, estado y opciones; al cambiar tipo a selección múltiple, la plantilla muestra el campo de opciones. Véanse `surveyForm`, `createQuestion()` y [create-survey.html](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.html).
3. `save()` valida, arma el payload en español y elige `crearEncuesta()` (`POST /api/surveys`) o, en modo edición, `actualizarEncuesta()` (`PUT /api/surveys/{id}`). `aPayloadBackend()` convierte título/descripcion/preguntas a `title/description/questions` y los tipos a `Escala`, `Abierta` o `Seleccion Multiple`; escala fabrica opciones 1 a 5. Véanse `save()` en [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts) y `aPayloadBackend()`/`aTipoBackend()` en [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts).
4. “Ver” usa `/admin/surveys/:id`: `cargarEncuesta()` hace GET, rellena el formulario y lo deshabilita en modo `view`. “Editar” usa `/:id/edit` y deja habilitado el mismo formulario; tras guardar, vuelve al listado. Véanse [admin.routes.ts](../encuestas-ue/src/app/features/admin/admin.routes.ts), `cargarEncuesta()` y `save()` en [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts).
5. La tabla admin también tiene enlaces a resultados y una acción para generar/descargar un QR que codifica la URL del formulario de usuario. El PNG se produce localmente con `QrService`, no se sube al backend. Véanse `generarQr()`/`descargarQr()` en [surveys.ts (admin)](../encuestas-ue/src/app/features/admin/surveys/surveys.ts) y `generar()` en [qr.service.ts](../encuestas-ue/src/app/core/services/qr.service.ts).

### Menú lateral y protección por rol

`AppLayout` elige el menú mirando `router.url.startsWith('/admin')`, no una comprobación directa de rol. El perfil también se enlaza al espacio admin o user; `toggleSidebar()` cambia el signal y `logout()` llama `AuthService.logout()`. Véanse [app-layout.ts](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.ts) y sus condiciones/eventos en [app-layout.html](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.html).

En navegación a `/admin`, `authGuard` exige token y `adminGuard` exige token más `currentUser.roleId === 1` (comparación estricta, debe ser número). La protección está aplicada en el padre de las rutas admin en [app.routes.ts](../encuestas-ue/src/app/app.routes.ts) y definida en [auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts). Si falla, ambos envían a `/login`. El backend debería validar permisos también; que lo haga es **NO VERIFICADO**. Hay una diferencia importante: `AuthService` acepta `role_id` y `rol === 'Administrador'` para identificar admin, pero `adminGuard` solo acepta `roleId` numérico; con esas otras formas de usuario, la interfaz podría reconocer rol admin y aun así bloquear la ruta. Véanse `guardarSesion()` y `restaurarSesion()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts).

## 3. Ficha por archivo

Esta tabla incluye **todos los `.ts` hallados bajo `core/`, `features/` y `shared/`**, también los archivos `.spec.ts`. Las pruebas se identifican por el componente o pantalla a la que corresponden; su resultado al ejecutarlas no se infiere aquí.

| Archivo | Qué es y responsabilidad |
|---|---|
| [core/auth/auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts) | Guards funcionales: permiten o bloquean navegación autenticada/admin. |
| [core/auth/auth.interceptor.ts](../encuestas-ue/src/app/core/auth/auth.interceptor.ts) | Interceptor HTTP que adjunta el token Bearer cuando existe. |
| [core/auth/auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts) | Servicio de sesión, registro, login, perfil y recuperación de contraseña. |
| [core/services/encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts) | Servicio HTTP de listados, CRUD, respuestas, QR y resultados. |
| [core/services/qr.service.ts](../encuestas-ue/src/app/core/services/qr.service.ts) | Servicio que genera una imagen QR a partir de texto/URL. |
| [features/admin/admin.routes.ts](../encuestas-ue/src/app/features/admin/admin.routes.ts) | Rutas hijas del área de administración. |
| [features/admin/dashboard/dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts) | Componente de métricas y cálculo de distribuciones. |
| [features/admin/dashboard/dashboard.spec.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.spec.ts) | Archivo de pruebas del dashboard. |
| [features/admin/questions/questions.ts](../encuestas-ue/src/app/features/admin/questions/questions.ts) | Placeholder vacío para preguntas admin; no tiene lógica de pantalla. |
| [features/admin/questions/questions.spec.ts](../encuestas-ue/src/app/features/admin/questions/questions.spec.ts) | Archivo de pruebas del placeholder `Questions`. |
| [features/admin/surveys/surveys.ts](../encuestas-ue/src/app/features/admin/surveys/surveys.ts) | Listado admin, filtros locales y modal/descarga de QR. |
| [features/admin/surveys/surveys.spec.ts](../encuestas-ue/src/app/features/admin/surveys/surveys.spec.ts) | Archivo de pruebas del listado admin. |
| [features/admin/surveys/create/create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts) | Formulario de crear, editar y ver encuesta. |
| [features/admin/surveys/results/survey-results/survey-results.ts](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts) | Lista estudiantes que respondieron una encuesta. |
| [features/admin/surveys/results/student-answers/student-answers/student-answers.ts](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts) | Consulta, filtra y presenta respuestas de un estudiante. |
| [features/auth/forgot-password/forgot-password.ts](../encuestas-ue/src/app/features/auth/forgot-password/forgot-password.ts) | Formulario de solicitud de recuperación. |
| [features/auth/forgot-password/forgot-password.spec.ts](../encuestas-ue/src/app/features/auth/forgot-password/forgot-password.spec.ts) | Archivo de pruebas de recuperación de contraseña. |
| [features/auth/login/login.ts](../encuestas-ue/src/app/features/auth/login/login.ts) | Formulario y validación de inicio de sesión. |
| [features/auth/login/login.spec.ts](../encuestas-ue/src/app/features/auth/login/login.spec.ts) | Archivo de pruebas del login. |
| [features/auth/register/register.ts](../encuestas-ue/src/app/features/auth/register/register.ts) | Formulario de registro y validación entre dos contraseñas. |
| [features/auth/register/register.spec.ts](../encuestas-ue/src/app/features/auth/register/register.spec.ts) | Archivo de pruebas del registro. |
| [features/auth/reset-password/reset-password.ts](../encuestas-ue/src/app/features/auth/reset-password/reset-password.ts) | Formulario para cambiar contraseña usando token de query param. |
| [features/auth/reset-password/reset-password.spec.ts](../encuestas-ue/src/app/features/auth/reset-password/reset-password.spec.ts) | Archivo de pruebas de cambio de contraseña. |
| [features/auth/session-closed/session-closed.ts](../encuestas-ue/src/app/features/auth/session-closed/session-closed.ts) | Componente de presentación del cierre de sesión. |
| [features/profile/edit/profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts) | Formulario de perfil, selección y preparación de foto. |
| [features/profile/view/profile.ts](../encuestas-ue/src/app/features/profile/view/profile.ts) | Presenta los datos actuales del perfil. |
| [features/user/user.routes.ts](../encuestas-ue/src/app/features/user/user.routes.ts) | Rutas hijas del área de usuario. |
| [features/user/available-surveys/available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts) | Listado de encuestas, navegación a responder y escáner QR. |
| [features/user/available-surveys/available-surveys.spec.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.spec.ts) | Archivo de pruebas de encuestas disponibles. |
| [features/user/responses/responses.ts](../encuestas-ue/src/app/features/user/responses/responses.ts) | Placeholder vacío de respuestas del usuario, sin ruta. |
| [features/user/responses/responses.spec.ts](../encuestas-ue/src/app/features/user/responses/responses.spec.ts) | Archivo de pruebas del placeholder `Responses`. |
| [features/user/survey-success/survey-success.ts](../encuestas-ue/src/app/features/user/survey-success/survey-success.ts) | Calcula el número de preguntas para la pantalla de confirmación. |
| [features/user/survey-success/survey-success.spec.ts](../encuestas-ue/src/app/features/user/survey-success/survey-success.spec.ts) | Archivo de pruebas de confirmación de encuesta. |
| [features/user/surveys/surveys.ts](../encuestas-ue/src/app/features/user/surveys/surveys.ts) | Carga preguntas, gestiona respuestas locales y envía la encuesta contestada. |
| [features/user/surveys/surveys.spec.ts](../encuestas-ue/src/app/features/user/surveys/surveys.spec.ts) | Archivo de pruebas del formulario de respuesta. |
| [shared/layout/app-layout/app-layout.ts](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.ts) | Layout con menú lateral compartido y cierre de sesión. |
| [shared/models/encuesta-dashboard.model.ts](../encuestas-ue/src/app/shared/models/encuesta-dashboard.model.ts) | Modelo del selector de encuestas del dashboard. |
| [shared/models/encuesta-disponible.model.ts](../encuestas-ue/src/app/shared/models/encuesta-disponible.model.ts) | Modelo de las tarjetas del usuario. |
| [shared/models/encuesta.models.ts](../encuestas-ue/src/app/shared/models/encuesta.models.ts) | Interfaz central de encuesta y relaciones. |
| [shared/models/estado-encuesta-admin.model.ts](../encuestas-ue/src/app/shared/models/estado-encuesta-admin.model.ts) | Estados de encuesta admin y etiquetas visibles. |
| [shared/models/estudiante-encuestado.model.ts](../encuestas-ue/src/app/shared/models/estudiante-encuestado.model.ts) | Datos de un estudiante que respondió. |
| [shared/models/item.model.ts](../encuestas-ue/src/app/shared/models/item.model.ts) | Entidad genérica relacionada como profesor de una encuesta. |
| [shared/models/pregunta.model.ts](../encuestas-ue/src/app/shared/models/pregunta.model.ts) | Tipos, estados y campos del modelo de pregunta. |
| [shared/models/respuesta-pregunta.model.ts](../encuestas-ue/src/app/shared/models/respuesta-pregunta.model.ts) | Modelo de respuesta individual que consume el detalle del estudiante. |
| [shared/models/tipo-encuesta.model.ts](../encuestas-ue/src/app/shared/models/tipo-encuesta.model.ts) | Tipos de encuesta y opciones legibles. |
| [shared/utils/imagen.util.ts](../encuestas-ue/src/app/shared/utils/imagen.util.ts) | Conversión y reducción de imágenes para la foto de perfil. |

## 4. Ficha por componente y servicio

Los métodos y propiedades están documentados según sus nombres y usos actuales. Las referencias incluyen los nombres de métodos relevantes; no implican que el endpoint remoto haya sido probado.

### Autenticación

**`AuthService`** — [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts)

| Miembro | Qué hace |
|---|---|
| `apiUrl` | Toma el prefijo de API del environment. |
| `currentUser` | Signal con el usuario de la sesión o `null`. |
| `errorMessage`, `loading` | Exponen error y estado de petición a las pantallas. |
| `photoBase64`, `userRole` | Mantienen foto y rol para mostrar perfil y navegación. |
| `authReady`, `authReadyPromise`, `resolverAuthReady` | Permiten que guards esperen a terminar de restaurar la sesión. |
| `profileUpdateSuccess`, `passwordResetSent` | Señalan éxito del guardado de perfil y solicitud de recuperación. |
| `normalizarUsuario()` | Asegura `displayName` tomando `displayName`, luego `name`, o vacío. |
| `restaurarSesion()` | Lee `token` y `user` de `localStorage`, rellena signals y termina la promesa de autenticación. |
| `registerWithEmail()` | Envía el registro a `POST /users`, informa éxito/error y redirige al login. |
| `loginWithEmail()` | Envía credenciales, delega el guardado y luego llama `afterLogin()`. |
| `guardarSesion()` | Acepta varias formas de token/usuario, los guarda y normaliza el rol. |
| `updateUserProfile()` | Envía nombre y foto opcional con `PUT /users/{id}` y actualiza el estado local. |
| `logout()` | Borra token/usuario, limpia usuario/rol y navega a `session-closed`. |
| `getAccessToken()` | Devuelve el token almacenado como promesa. |
| `tieneSesionActiva()` | Comprueba existencia del token; no valida expiración ni firma. |
| `afterLogin()` | Decide la ruta inicial según `userRole`. |
| `sendPasswordReset()` | Envía correo a `POST /forgot-password` y activa el signal de éxito. |
| `resetPasswordConfirm()` | Envía token y contraseña nueva a `POST /reset-password`; en éxito navega al login. |

**Nota.** `adminGuard` interpreta el rol con una regla más estrecha que `guardarSesion()`. Además, `logout()` no limpia explícitamente `photoBase64`, `errorMessage`, ni los signals de carga/éxito; qué se observa en una sesión posterior depende del siguiente estado que los actualice.

**`authGuard` y `adminGuard`** — [auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts)

- `authGuard`: con el bypass configurado, permite acceso; en caso normal espera `authReadyPromise`, comprueba `tieneSesionActiva()` y redirige a `/login` si no hay token.
- `adminGuard`: espera restauración y acepta únicamente sesión con `currentUser()?.roleId === 1`; en otro caso redirige a `/login`.

**`authInterceptor`** — [auth.interceptor.ts](../encuestas-ue/src/app/core/auth/auth.interceptor.ts)

- `authInterceptor(req, next)`: pide el token a AuthService. Si hay token clona la petición con `Authorization: Bearer ...`; si no, envía la solicitud original. Está registrado globalmente en [app.config.ts](../encuestas-ue/src/app/app.config.ts).

**LoginComponent** — [login.ts](../encuestas-ue/src/app/features/auth/login/login.ts)

- Propiedades: `form` (correo y clave con validadores); `mostrarPassword` (signal que alterna tipo de input); `auth` (servicio compartido).
- `submit()`: marca el formulario inválido como tocado o llama `loginWithEmail()`.
- `alternarPassword()`: invierte el signal de visibilidad.

**RegisterComponent** — [register.ts](../encuestas-ue/src/app/features/auth/register/register.ts)

- Propiedades: `form` (nombre, correo, clave y confirmación); `mostrarPassword`, `mostrarConfirmarPassword`; `auth`.
- `passwordsIgualesValidator()`: validador de grupo que compara dos controles, no solo un campo.
- `confirmarPasswordTieneError`: evita mostrar errores antes de tocar confirmación y reconoce diferencia de claves.
- `submit()`: valida y llama el registro sin incluir `confirmarPassword` en el payload.
- `alternarPassword()` / `alternarConfirmarPassword()`: cambian visibilidad de cada input por separado.
- Constructor: limpia un mensaje de error anterior.

**ForgotPasswordComponent** — [forgot-password.ts](../encuestas-ue/src/app/features/auth/forgot-password/forgot-password.ts)

- Propiedades: `form` con correo y validadores; `auth`.
- Constructor: limpia error y `passwordResetSent` previos.
- `submit()`: valida el correo y llama `sendPasswordReset()`.

**ResetPasswordComponent** — [reset-password.ts](../encuestas-ue/src/app/features/auth/reset-password/reset-password.ts)

- Propiedades: `form` con `newPassword` (mínimo seis caracteres); `token`; dependencias `route` y `auth`.
- `ngOnInit()`: limpia error y lee el query param `token` con `queryParamMap`.
- `submit()`: no continúa si formulario inválido o token ausente; en otro caso llama `resetPasswordConfirm()`.

**SessionClosedComponent** — [session-closed.ts](../encuestas-ue/src/app/features/auth/session-closed/session-closed.ts)

- No declara propiedades ni métodos de negocio; importa `RouterLink` y presenta su plantilla con enlace para volver.

### Encuestas y QR

**EncuestasService** — [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts)

| Miembro | Qué hace |
|---|---|
| `apiUrl` | Forma `${environment.apiUrl}/surveys`. |
| `getOptions()` | Crea headers JSON/Bearer leyendo `localStorage` y agrega params opcionales. |
| `obtenerEncuestasDisponibles()` | GET de encuestas del usuario y adapta varias formas de respuesta/campos. |
| `obtenerTodasLasEncuestas()` | GET general; acepta array directo, `data` o `encuestas`. Sin caller detectado. |
| `obtenerEncuestasAdmin()` | GET con `includeInactive=true`; llamada por listado admin y dashboard. |
| `enviarRespuestas()` | POST de respuestas para un ID de encuesta. |
| `aTipoBackend()` | Convierte códigos de tipo a las etiquetas backend asumidas. |
| `aPayloadBackend()` | Cambia nombres de campos, prepara opciones y omite preguntas inactivas. |
| `crearEncuesta()` / `actualizarEncuesta()` | POST/PUT para persistir payload transformado. |
| `listarEncuestas()` | GET con filtros opcionales `busqueda` y `estado`. Sin caller detectado. |
| `obtenerEncuestaPorId()` | GET de detalle usado por crear encuesta en modo editar/ver. |
| `obtenerEncuestaParaResponder()` | GET y conversión del DTO en inglés/camelCase a forma local de preguntas. |
| `publicarEncuesta()` / `desactivarEncuesta()` | PATCH a subrutas respectivas; no hay caller encontrado. |
| `listarEstudiantesQueRespondieron()` | GET de estudiantes de una encuesta; usado por resultados admin. |
| `obtenerRespuestasEstudiante()` | GET de respuestas, admite fechas opcionales; usado por StudentAnswers. |
| `getSurveyByQR()` | GET `/surveys/{id}` usado al validar lo leído por el escáner; no llama una ruta `/qr/`. |
| `obtenerResultadosBrutos()` | GET `/surveys/{id}/responses`; usado por dashboard. |

**Nota.** El serializer `aPayloadBackend()` no incluye `estado` de la encuesta aunque el formulario lo tenga. En una pregunta de escala fabrica cinco opciones. La respuesta `opciones` del mapper a responder es una colección de objetos `{id, texto}`, mientras `Pregunta.opciones` del modelo declara `string[]`; revisar tipos declarados junto con valores efectivos.

**QrService** — [qr.service.ts](../encuestas-ue/src/app/core/services/qr.service.ts)

- `generar(texto, opciones?)`: llama `QRCode.toDataURL()` para crear una imagen Base64 de un QR; el ancho predeterminado es 260 y el margen 1.
- No contiene método de lectura/escaneo; esa cámara está en `AvailableSurveysComponent`.

**Surveys (admin)** — [surveys.ts](../encuestas-ue/src/app/features/admin/surveys/surveys.ts)

- Propiedades/signals: `estados`, `selectedStatus`, `fechaDesde`, `fechaHasta`, `surveys`; estado de modal `qrSurvey`, `qrDataUrl`, `qrLoading`; `filteredSurveys` recalcula por estado y fechas.
- `ngOnInit()` / `cargarEncuestas()`: solicitan lista admin y traducen cada respuesta a `Survey`; el profesor mostrado es constante `Admin`, y si falta fecha usa la fecha del día local.
- `updateStatus()`, `updateFechaDesde()`, `updateFechaHasta()`, `limpiarFechas()`: leen eventos del DOM y actualizan filtros locales.
- `formatDate()`: interpreta `YYYY-MM-DD` como fecha local y la muestra en español de Colombia.
- `generarQr()`: codifica `${window.location.origin}/user/responder-encuesta/{id}` y muestra el modal.
- `cerrarQr()`: limpia estado del modal.
- `descargarQr()`: crea un enlace temporal y descarga un PNG.

**Nota.** El listado se carga del endpoint, pero filtros de fecha/estado son locales. El QR codifica una ruta web; la lectura de ese código no demuestra por sí misma que la encuesta esté publicada: la validación que hace el cliente es un GET de detalle normal (`getSurveyByQR()`).

**CreateSurvey** — [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts)

- Signals: `saving`, `saved`, `errorMessage`, `mode` (`create`, `edit`, `view`); también `surveyId`, `estados`, `tiposPregunta`.
- `surveyForm`: formulario reactivo con `title`, `description`, `status` y `questions` (`FormArray`). Los controles incluyen validaciones de longitud y obligatoriedad.
- Constructor: toma el `id` de `paramMap`; decide modo según `route.snapshot.data['mode']` y carga si es editar/ver.
- `questions`: getter del `FormArray`.
- `getTipoLabel()`, `getOpciones()`, `getQuestionText()`, `isQuestionInvalid()`: helpers para etiqueta, separación de opciones por línea y estado/valor de pregunta.
- `createQuestion()`: construye grupo con tipo inicial `ESCALA`, requerida por defecto y texto de opciones vacío.
- `cargarEncuesta()`: llama GET y rellena título/descr./estado/preguntas; en modo view deshabilita el formulario.
- `preguntaDesdeBackend()`: traduce `Escala`/`Abierta` a tipos locales; cualquier otra cadena queda como selección múltiple; reúne las opciones como texto separado por líneas.
- `addQuestion()` / `removeQuestion()`: agregan o quitan pregunta; impide quedarse sin ninguna.
- `cancel()`: vuelve al listado admin.
- `save()`: no hace nada en modo view; valida, construye el payload (opciones múltiples por línea) y llama crear o actualizar.

**Nota.** Al cargar, el estado se reduce a `PUBLICADA` cuando `Number(status) === 1` y a `INACTIVA` en otro caso; no recupera explícitamente `BORRADOR`. Aunque el formulario guarda `status`, el mapeo de servicio no lo manda al backend. Errores de carga muestran alerta y navegan al listado.

**Dashboard** — [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts)

- Propiedades: `selectedSurvey`, `selectedDate`, `isLoading`, `surveys`, `questions`, `kpis`, `activeQuestionId`; tipos internos `Question` y `Bar` organizan la gráfica.
- `ngOnInit()`: carga encuesta admin para el selector.
- `filteredSurveys`: getter que filtra por fecha de creación en cliente.
- `activeQuestion`: encuentra la pregunta actualmente seleccionada.
- `selectQuestion()`: cambia la pregunta destacada.
- `onDateChange()`: limpia la encuesta seleccionada y estadísticas si deja de estar en las fechas filtradas.
- `onSurveyChange()`: carga definición y respuestas brutas de la encuesta, en dos solicitudes encadenadas.
- `resetStats()`: vacía indicadores, preguntas y selección.
- `procesarEstadisticas()`: ignora abiertas; para escala calcula conteos 1-5 y promedio general; para selección múltiple suma selecciones por opción y prepara barras/highlight.

**Nota.** El promedio general se calcula solo para escalas. La plantilla muestra `totalRespuestas` como el número de elementos de la respuesta bruta. Cómo se agregan esos elementos en backend es **NO VERIFICADO**; porcentajes de selección múltiple usan el total de marcas/opciones encontradas como denominador.

**SurveyResults** — [survey-results.ts](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts)

- `encuestaId`: lee `id` de `paramMap`; `encuestaNombre` parte de “Detalle de Resultados”; `estudiantes` es signal con lista vacía inicial.
- `ngOnInit()` llama `cargarEstudiantes()` si hay id.
- `cargarEstudiantes()` llama `listarEstudiantesQueRespondieron()` y actualiza signal; error muestra alerta.
- `formatDate()`: corta componente de fecha ISO y muestra día, mes corto y año en español CO.

**StudentAnswers** — [student-answers.ts](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts)

- IDs `encuestaId` y `estudianteId` se leen de la ruta. Signals `fechaDesde`, `fechaHasta`, `estudianteNombre`, `estudianteCorreo` y `respuestas`.
- `ngOnInit()` dispara `cargarRespuestasEstudiante()` con ambos IDs.
- `cargarRespuestasEstudiante()`: envía fechas actuales al servicio y guarda la lista; error muestra alerta.
- `respuestasFiltradas`: calcula en memoria un segundo filtro por fecha ISO.
- `updateFechaDesde()`/`updateFechaHasta()`/`limpiarFechas()`: cambian signals del filtro.
- `etiquetaTipo()`: convierte tipos frontend/backend a etiquetas en español.
- `formatDate()`: presenta fecha para la tarjeta.

**Nota.** El nombre/correo empiezan con valores de ejemplo y no se rellenan en `cargarRespuestasEstudiante()`. La petición inicial corre con filtros vacíos; cambiar fechas solo cambia la lista local calculada, no vuelve a llamar al servidor.

### Pantallas de usuario, perfil y layout

**AvailableSurveysComponent** — [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts)

- Propiedades: `encuestas`, `isScanning`, `html5QrCode`; servicios `router`, `encuestasService`, `cdr`.
- `ngOnInit()` carga lista; `cargarEncuestasReales()` solicita y guarda tarjetas; `ngOnDestroy()` detiene/limpia el lector.
- `responderEncuesta()` evita repetir encuesta marcada como completada o navega a responder.
- `obtenerClaseBadge()` asigna clase según estado.
- `escanearQR()` muestra área de cámara, espera 300 ms para que el elemento exista, abre `Html5Qrcode` con cámara `environment` y configura escaneo.
- Callback de lectura detiene escáner y llama `procesarCodigoEscaneado()`.
- `detatarEscaneo()` (así está escrito el identificador) detiene y limpia la cámara; llama `cdr.detectChanges()`.
- `procesarCodigoEscaneado()` toma el último fragmento de texto separado por `/`, hace GET de encuesta mediante `getSurveyByQR()` y navega a responder si el GET resulta exitoso.

**Nota.** `ChangeDetectorRef.detectChanges()` aparece tras callbacks del lector externo para reflejar el estado de cámara en la plantilla. El parser toma el último fragmento de cualquier URL, no comprueba host o ruta esperados; esa validación del texto no se debe presentar como verificación de seguridad.

**SurveysComponent (usuario)** — [surveys.ts](../encuestas-ue/src/app/features/user/surveys/surveys.ts)

- Propiedades: `encuesta` empieza con texto de carga; `indicePreguntaActual`; opciones 1-5; `respuestasGuardadas` (listas de IDs de opción por pregunta); `respuestasTexto` (texto por pregunta); route/router/change detector/service.
- `ngOnInit()`: obtiene parámetro de ruta usando `Object.values(snapshot.params)[0]`; si falta vuelve a disponibles; en caso contrario carga el DTO transformado y llama detección de cambios.
- `preguntaActual`, `textoRespuestaActual`: getters de pregunta/texto correspondientes al índice actual.
- `puedeContinuar`: permite pregunta opcional; en requerida, comprueba que exista selección si tiene opciones o texto no vacío si es abierta.
- `actualizarTexto()`: escribe texto bajo el id actual.
- `estaSeleccionada()`: permite que plantilla pinte botón activo según IDs guardados.
- `numeroPreguntaVisual`, `progresoPorcentaje`, `esUltimaPregunta`, `esPrimeraPregunta`: valores derivados de la lista e índice.
- `seleccionarCalificacion()`: alterna IDs para selección múltiple; para escala u otro tipo con opciones conserva solo un ID.
- `siguienteOFinalizar()` / `anterior()`: incrementa o reduce índice bajo sus límites.
- `finalizar()`: recorre preguntas, forma `details`, devuelve al índice de una obligatoria sin respuesta o envía el payload; muestra resultado y navega a confirmación.

**Nota.** El ID de encuesta se lee por posición (`Object.values`) en lugar del nombre `id`; funciona con la ruta actual de un único parámetro, pero es menos explícito. Para diferenciar pregunta abierta de opción única, la plantilla usa si hay `opciones`, mientras el guardado usa además `tipo === 'Seleccion Multiple'`.

**SurveySuccess** — [survey-success.ts](../encuestas-ue/src/app/features/user/survey-success/survey-success.ts)

- Propiedades: `route`, servicio y `totalQuestions`.
- `ngOnInit()`: prefiere el query param `total`; si falta, consulta encuesta por id y toma longitud de `preguntas` o `questions`.
- Error de respaldo solo se escribe en consola; no hay un signal de error visual propio.

**ProfileComponent** — [profile.ts](../encuestas-ue/src/app/features/profile/view/profile.ts)

- `auth` y `router` proporcionan estado de sesión y URL.
- `nombre`: computed signal que lee `displayName` y devuelve `(sin nombre)` si queda vacío.
- `editProfilePath`: getter que conserva el área actual (admin/user) al enlazar a edición.

**ProfileEditComponent** — [profile-edit.ts](../encuestas-ue/src/app/features/profile/edit/profile-edit.ts)

- Propiedades: `archivoSeleccionado`, `previewFoto`, formulario con `nombre`, `auth`, router.
- Constructor limpia errors/éxito previos y precarga el `displayName`.
- `profilePath`: mantiene el usuario en la misma sección al cancelar.
- `onFotoSeleccionada()`: guarda primer archivo y crea URL de vista previa.
- `submit()`: valida; opcionalmente convierte la imagen a Base64 y pide actualizar perfil con apellido vacío.

**AppLayout** — [app-layout.ts](../encuestas-ue/src/app/shared/layout/app-layout/app-layout.ts)

- `sidebarOpen`: signal que controla el menú móvil.
- `profilePath`: calcula enlace a perfil según ruta.
- `isAdminSection`: reconoce sección admin mirando el prefijo de URL.
- `toggleSidebar()` / `closeSidebar()`: abren o cierran el menú.
- `logout()`: delega cierre de sesión al servicio.

**Nota.** El menú depende de la URL, pero la autorización de acceso depende de guards. La visibilidad de un enlace no es una regla de permisos.

**App** — [app.ts](../encuestas-ue/src/app/app.ts)

- `title`: signal inicializado a `encuestas-ue`; la plantilla monta `RouterOutlet`. El provider del router está en [app.config.ts](../encuestas-ue/src/app/app.config.ts).

**Questions** — [questions.ts](../encuestas-ue/src/app/features/admin/questions/questions.ts) y **Responses** — [responses.ts](../encuestas-ue/src/app/features/user/responses/responses.ts)

- Clases sin propiedades/métodos de negocio. Sus plantillas no implementan flujos; no hay rutas registradas para estos componentes.

### Utilidad y formularios reactivos

**`comprimirImagenABase64()`** — [imagen.util.ts](../encuestas-ue/src/app/shared/utils/imagen.util.ts)

- Recibe `File` y `maxLado` (200 predeterminado); `FileReader` carga datos, `Image` permite medir dimensiones, `canvas` reduce proporcionalmente y `toDataURL('image/jpeg', 0.7)` devuelve Base64. Rechaza la promesa ante error de archivo/imagen.

En login/registro/recuperación y `CreateSurvey` se usa `ReactiveFormsModule`; sus controles y validadores están definidos en los respectivos `.ts`. Los formularios se enlazan desde las plantillas con `[formGroup]`, `formControlName` y `(ngSubmit)`, por ejemplo en [register.html](../encuestas-ue/src/app/features/auth/register/register.html) y [create-survey.html](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.html).

## 5. Modelos e interfaces

Los modelos de esta sección son los archivos de `shared/models`. Los nombres ingleses se pueden afirmar como traducciones solo donde el mapper del servicio los lee o los envía; para equivalencias no observables, queda **NO VERIFICADO**.

| Modelo e interfaz | Campos y significado | Dónde aparece / relación con backend |
|---|---|---|
| `Encuesta` — [encuesta.models.ts](../encuestas-ue/src/app/shared/models/encuesta.models.ts) | `id`: identificador; `titulo`: título; `descripcion?`: explicación opcional; `tipo`: `TipoEncuesta`; `profesor`: `Item`; `estado?`: estado admin; `fechaCreacion?`: fecha opcional; `preguntas`: preguntas incluidas. | Lo usan servicio y pantalla de respuesta. El mapper del servicio produce `id/titulo/descripcion/preguntas` desde `surveyId/title/description/questions`; no mapea `tipo`, `profesor`, `estado` ni `fechaCreacion`. Equivalencia de esos campos: **NO VERIFICADO**. |
| `Pregunta` — [pregunta.model.ts](../encuestas-ue/src/app/shared/models/pregunta.model.ts) | `id`: ID; `texto` y `enunciado`: formulación; `tipo`: unión de tipos; `opciones?`: declarado `string[]`; `requerida`: obligatoriedad; `displayOrder`: posición; `estado`: activa/inactiva. | Formulario admin y formulario de usuario. DTO backend usa `questionId`, `questionText`, `questionType`, `isRequired`, `displayOrder`, `options`; el mapper user produce opciones `{id,texto}`, no strings, una diferencia visible respecto a la interfaz. |
| `TipoPregunta` / `EstadoPregunta` — [pregunta.model.ts](../encuestas-ue/src/app/shared/models/pregunta.model.ts) | Tipo: `ESCALA`, `ABIERTA`, `SELECCION_MULTIPLE`; estado: `ACTIVA`, `INACTIVA`. `TIPOS_PREGUNTA` aporta value y etiqueta de cada tipo. | Selector de tipo y decisiones de UI/serialización. Servicio convierte tipo a `Escala`, `Abierta` y `Seleccion Multiple`; correspondencia real servidor **NO VERIFICADO**. |
| `RespuestaPregunta` — [respuesta-pregunta.model.ts](../encuestas-ue/src/app/shared/models/respuesta-pregunta.model.ts) | `preguntaId`: ID pregunta; `preguntaTexto`: enunciado; `tipoPregunta`: tipo; `respuesta`: texto que representa opción/escala o respuesta abierta; `fechaRespuesta`: fecha. | Usado en `StudentAnswers`. La interface está en español, pero la llamada espera un arreglo con estas claves; forma que devuelve el servidor **NO VERIFICADO**. |
| `Item` — [item.model.ts](../encuestas-ue/src/app/shared/models/item.model.ts) | `id`, `nombre`, `descripcion?`, `estado` (`Activo`/`Inactivo`), `categoria`. | Se referencia como `Encuesta.profesor`. Nombres de campo backend **NO VERIFICADO**. |
| `TipoEncuesta` — [tipo-encuesta.model.ts](../encuestas-ue/src/app/shared/models/tipo-encuesta.model.ts) | `DOCENTE`, `CURSO`, `INSTITUCIONAL`; `TIPOS_ENCUESTA` asocia etiqueta visible. | Campo `Encuesta.tipo`; no se encontró su uso en el formulario actual ni un mapper backend. Equivalencia API **NO VERIFICADO**. |
| `EstadoEncuestaAdmin` — [estado-encuesta-admin.model.ts](../encuestas-ue/src/app/shared/models/estado-encuesta-admin.model.ts) | `BORRADOR`, `PUBLICADA`, `INACTIVA`; constante asocia las etiquetas en español. | Filtro y formulario admin. El servicio no envía este campo; cómo representa estados la API es **NO VERIFICADO**. |
| `EncuestaDisponible` / `EstadoEncuesta` — [encuesta-disponible.model.ts](../encuestas-ue/src/app/shared/models/encuesta-disponible.model.ts) | `id`, `titulo`, `subtitulo`, `iconoSubtitulo`, `estado`, `descripcion`, `totalPreguntas`, `fechaTexto`, `completada`; estado: disponible/pendiente/completado. | Tarjetas de user. Servicio traduce `id/surveyId/survey_id`, `title/titulo`, `description/descripcion`, `status/estado`, `completed`, `totalQuestions`; `subtitulo`, `iconoSubtitulo` y `fechaTexto` se crean localmente como valores fijos. |
| `EstudianteEncuestado` — [estudiante-encuestado.model.ts](../encuestas-ue/src/app/shared/models/estudiante-encuestado.model.ts) | `estudianteId`, `nombre`, `correo`, `fechaRespuesta`. | Resultado admin; los nombres que envía el endpoint para esos campos son **NO VERIFICADO**. |
| `EncuestaDashboard` / `EstadoEncuestaDashboard` — [encuesta-dashboard.model.ts](../encuestas-ue/src/app/shared/models/encuesta-dashboard.model.ts) | `survey_id`, `title`, `created_at`, `close_date`, `status`; estado: borrador/activa/inactiva. | El dashboard mapea `surveyId/id`, `title/titulo`, `createdAt`, `closeDate`, `status` a estas claves. `survey_id`, `created_at` son nombres internos, no afirmación del contrato servidor. |

También hay interfaces de payload/ayuda fuera de `shared/models`: `RegisterRequest` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), `CrearEncuestaPayload`/`EditarEncuestaPayload`/`FiltrosEncuestas` en [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts), y tipos internos `Survey`, `Bar`, `Question` en componentes admin. Son contratos locales del código; no prueban el esquema real del servidor.

## 6. Cómo se maneja el estado y la sesión

- **`localStorage`:** `token` contiene el token de acceso recibido (`token` o `access_token`); `user` contiene el usuario serializado. AuthService los escribe al iniciar sesión, modifica `user` al editar perfil y borra ambas claves al cerrar sesión. Véanse `guardarSesion()`, `updateUserProfile()` y `logout()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts).
- **Restaurar al recargar:** el constructor de AuthService llama `restaurarSesion()`. Si encuentra ambas claves, parsea usuario, rellena `currentUser`, rol y foto; termina poniendo `authReady` en true y resolviendo `authReadyPromise`. Los guards esperan esa promesa antes de decidir. Véanse constructor y `restaurarSesion()` en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), y [auth.guard.ts](../encuestas-ue/src/app/core/auth/auth.guard.ts).
- **`authGuard`:** en configuración normal, espera que la restauración termine y comprueba solamente que haya token en localStorage. Si no hay, navega a `/login`. No comprueba que el token sea válido o vigente.
- **`adminGuard`:** exige que haya token y que `currentUser.roleId` sea exactamente el número `1`; si no, redirige a `/login`. No usa la señal `userRole`.
- **Interceptor:** `authInterceptor` agrega `Authorization: Bearer <token>` a peticiones HTTP si el token existe. Está instalado en `app.config.ts`, así que componentes y servicios que usan HttpClient no deben añadir el header manualmente en el caso común. `updateUserProfile()` sí crea explícitamente sus headers; `EncuestasService.getOptions()` también arma headers propios. Véanse [auth.interceptor.ts](../encuestas-ue/src/app/core/auth/auth.interceptor.ts), [app.config.ts](../encuestas-ue/src/app/app.config.ts), [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts), [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts).
- **Environment actual:** ambas variantes declaran `http://localhost:3001/api`, `production: false` y `bypassAuthForDev: false`; por esos valores, el bypass no se activa. Véanse [environment.ts](../encuestas-ue/src/environment/environment.ts) y [environment.development.ts](../encuestas-ue/src/environment/environment.development.ts).
- **Límite de seguridad:** guards protegen navegación/visibilidad de vistas, no reemplazan autorización en servidor. El middleware/validación del backend es **NO VERIFICADO** porque ese código no forma parte de este frontend.

## 7. Glosario para la sustentación

- **Signal:** valor reactivo que Angular puede observar y que se lee como función; al cambiarlo, la plantilla puede reflejar el nuevo estado.
- **Observable:** flujo de datos asíncrono de RxJS; HttpClient devuelve observables a los que el componente se suscribe.
- **Guard:** función que decide antes de entrar a una ruta si se permite navegar.
- **Interceptor:** función que modifica o inspecciona peticiones HTTP de forma centralizada antes de enviarlas.
- **Standalone component:** componente que declara sus dependencias y puede usarse directamente, sin declararlo en un `NgModule`.
- **Formulario reactivo:** formulario cuyo estado, controles y validaciones se definen en TypeScript y se enlazan en la plantilla.
- **Lazy loading (carga diferida):** cargar un componente o conjunto de rutas al navegar a esa parte de la app, en vez de cargarlo todo al inicio.
- **`FormArray`:** colección dinámica de controles/grupos; aquí permite agregar o retirar preguntas de la encuesta.
- **`ChangeDetectorRef`:** API para pedirle a Angular que revise cambios; aquí se invoca tras callbacks de cámara.
- **DTO / payload:** objeto que el cliente prepara o espera para intercambiar datos con una API.

## 8. Qué es real y qué no, hoy

**Alcance de esta afirmación:** el repositorio contiene el cliente Angular, no el servidor. Por eso puedo confirmar llamadas y comportamiento en el frontend, pero no declarar ninguna pantalla “100% conectada al backend real” ni afirmar que endpoints, correos, permisos o escrituras funcionen de extremo a extremo. El environment apunta a `localhost:3001/api`; disponibilidad del backend en esa dirección: **NO VERIFICADO**.

**Pantallas que sí tienen llamadas HTTP implementadas en el frontend:**

- Registro, login, solicitud/cambio de contraseña y actualización de perfil: métodos HTTP en [auth.service.ts](../encuestas-ue/src/app/core/auth/auth.service.ts).
- Encuestas disponibles y detalle/envío de respuesta: llamadas desde [available-surveys.ts](../encuestas-ue/src/app/features/user/available-surveys/available-surveys.ts) y [surveys.ts (usuario)](../encuestas-ue/src/app/features/user/surveys/surveys.ts).
- Listado admin, creación/edición/lectura: llamadas desde [surveys.ts (admin)](../encuestas-ue/src/app/features/admin/surveys/surveys.ts) y [create-survey.ts](../encuestas-ue/src/app/features/admin/surveys/create/create-survey.ts).
- Dashboard: carga encuestas y respuestas brutas; calcula métricas en el navegador. Véase [dashboard.ts](../encuestas-ue/src/app/features/admin/dashboard/dashboard.ts).
- Lista de estudiantes y detalle de respuestas individuales: tienen suscripciones a métodos del servicio en [survey-results.ts](../encuestas-ue/src/app/features/admin/surveys/results/survey-results/survey-results.ts) y [student-answers.ts](../encuestas-ue/src/app/features/admin/surveys/results/student-answers/student-answers/student-answers.ts).
- La validación del escáner QR hace una consulta de detalle con `GET /surveys/{id}`; no hay ruta QR distinta en el método actual `getSurveyByQR()` de [encuestas.service.ts](../encuestas-ue/src/app/core/services/encuestas.service.ts).

**Datos locales, huecos o acciones a tener presentes en una demo:**

- QR se genera en el navegador y codifica la URL del frontend; el escaneo usa cámara con `html5-qrcode`. La consulta de validación no prueba por sí sola que la encuesta esté publicada ni que el servidor tenga una regla especial de QR.
- El formulario admin ofrece estado de encuesta, pero `aPayloadBackend()` no incluye ese estado en el JSON. Los métodos `publicarEncuesta()`/`desactivarEncuesta()` existen, pero no se encontraron llamadas desde componentes.
- En resultados por estudiante, `estudianteNombre` y `estudianteCorreo` son valores iniciales fijos y no se cargan desde la API en el método actual. Los filtros de fecha de esa pantalla se recalculan localmente y no vuelven a consultar al cambiar.
- `Questions` y `Responses` son placeholders y no tienen rutas registradas.
- El `teacher` del listado admin se fija como `Admin`; el subtítulo, icono y fecha textual de la tarjeta user se completan con valores definidos por el mapper del cliente.
- La URL/código QR, respuestas HTTP exitosas, validación del rol por backend y persistencia de los datos requieren probarse contra el servidor real: **NO VERIFICADO** en este workspace.
- En el código actual no encontré acciones de botón con cuerpo vacío en los flujos documentados; los placeholders sin ruta sí carecen de funcionalidad de negocio.

### Repaso antes de la sustentación (máximo 15 líneas)

1. `app.routes.ts` separa rutas públicas, admin y user; las dos áreas protegidas comparten `AppLayout`.
2. `authGuard` revisa presencia de token; `adminGuard` exige `roleId` numérico igual a 1.
3. `AuthService` guarda/restaura `token` y `user` en localStorage y define el destino tras login.
4. El interceptor agrega el Bearer a solicitudes HTTP cuando hay token.
5. El environment del repositorio apunta a `http://localhost:3001/api`.
6. `EncuestasService` traduce varios nombres backend en inglés a modelos de pantalla en español.
7. Las preguntas respondidas se conservan en memoria hasta pulsar finalizar.
8. Escala envía una opción; selección múltiple envía un detalle por cada opción marcada.
9. Respuesta abierta envía `responseText`; el POST agrupa todo en `details`.
10. El formulario admin reutiliza el mismo componente para crear, editar y leer.
11. El dashboard calcula métricas de escala y selección múltiple en el frontend.
12. El QR es una URL generada localmente; el escáner lee con la cámara y consulta el detalle.
13. Las pantallas de resultados consultan servicio, pero algunos datos de identidad tienen defaults fijos.
14. El estado seleccionado en el formulario de encuesta no se incluye en el payload actual.
15. El backend no está en este workspace: contratos y persistencia extremo a extremo son **NO VERIFICADO**.
