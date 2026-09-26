# Reto_Encuestas C:

## 1 -- Versiones

- **Node.js 22 o superior** Verifica con:
  ```bash
  node -v
  ```
- **Angular CLI 22**: 22.0.7
  ```bash
  npm install -g @angular/cli@22
  ```

## 2 -- Setup inicial
Se creo el proyecto utilizando -- style=scss para poder hacer uso de variables y anidar estilos

```bash
npm install
npm install bootstrap firebase qrcode jsqr
```

- `styles.scss` ya trae el `@import` de Bootstrap, así que no necesitas tocar `angular.json` para los estilos.
- `qrcode` se usa para **generar** los códigos QR (vista Admin); `jsqr` se usa para **leerlos** desde la cámara (vista User). Si te clonas el repo y te falta alguno, instálalo con el comando de arriba.


## 3 -- Estilos globales y colores

En `styles.scss` están todas las variables de color/tipografía (`:root { --color-primary: ...; --color-secondary: ...; }`). **Regla del equipo:** no metan colores en hexadecimal sueltos en un componente nuevo — usen siempre `var(--color-primary)`, `var(--color-secondary)`, etc. Así, si el color de marca cambia, se actualiza en un solo lugar.

Convención de uso que acordamos: el **rojo** (`--color-primary`) es el color de marca/acento — títulos, badges de estado, algo destacado —, mientras que el **azul** (`--color-secondary`) es el color de **acción principal** (botones de "Guardar", "Crear", "Siguiente", "Responder", CTA principales). Ninguno de los dos debe "comerse" a la app entera; la idea es que convivan.


## 4 -- Estructura de carpetas (qué va donde)
src/app/
├── core/
│ ├── auth/ # AuthService, guard e interceptor
│ ├── config/ # Inicialización de Firebase
│ └── services/
│ ├── encuestas.service.ts # CRUD de encuestas, resultados por estudiante, consulta por QR
│ └── qr.service.ts # Generación de imágenes QR (usado por Admin > Encuestas)
├── shared/
│ ├── components/
│ ├── models/ # Interfaces TS: Encuesta, Pregunta, EstudianteEncuestado,
│ │ # RespuestaPregunta, EstadoEncuestaAdmin, TipoEncuesta...
│ └── layout/ # app-layout (sidebar + topbar compartidos entre Admin y User)
└── features/
├── auth/ # login, register, forgot-password, session-closed
├── profile/ # view + edit — compartido entre Admin y User (un solo campo "Nombre")
├── admin/
│ ├── dashboard/ # 🚧 en rediseño (no tocar sin avisar)
│ ├── surveys/
│ │ ├── create/ # Crear encuesta (título, descripción, estado, preguntas)
│ │ └── results/ # Resultados: estudiantes que respondieron → respuestas por estudiante
│ └── questions/ # placeholder, sin usar todavía
└── user/
├── available-surveys/ # Encuestas disponibles para responder
├── surveys/ # Pantalla de responder una encuesta puntual
├── survey-success/ # Confirmación tras enviar respuestas

> Ya no existe `features/admin/teachers/` (la sección "Docentes" se eliminó del admin) ni `features/user/responses/` (era un placeholder vacío, "Mis respuestas" se quitó del menú de User).

## 5 — Configuración variables de entorno

Estos archivos NO vienen en el repositorio (contienen llaves reales de Firebase):

```bash
cp src/environments/environment.example.ts src/environments/environment.ts               # apunta a un backend local (http://localhost:3000/api) y a un proyecto de Firebase de pruebas.
cp src/environments/environment.example.ts src/environments/environment.development.ts   # apunta al backend ya desplegado y al proyecto de Firebase real.
```

Pedir las llaves reales de Firebase y pegarlas en esos dos archivos (o encontrarlas en el grupo de whatsapp).

## 6 — Login

- `core/config/firebase.config.ts`: prende Firebase una sola vez.
- `core/auth/auth.service.ts`: el único lugar que habla con Firebase Auth (login con email, login con Microsoft, logout, obtener el token, actualizar perfil).
- `core/auth/auth.guard.ts`: bloquea rutas si no hay sesión iniciada.
- `core/auth/auth.interceptor.ts`: agrega el token de Firebase a cada petición HTTP que salga hacia Node.js.
- `features/auth/login/`: el formulario (HTML + Bootstrap) que usa el `AuthService`.

## 7 — Código QR: cómo funciona

Esto le importa tanto a Frontend como a Backend, quedó así:

**Generación (Admin → `features/admin/surveys/surveys.ts`):**
El QR no guarda ninguna imagen ni datos del formulario — codifica **una URL de texto plano**:
`{origen_de_la_app}/user/responder-encuesta/{id-de-la-encuesta}`

Como se usa `window.location.origin`, si generas el QR desde `localhost:4200` el código solo va a funcionar en esa misma máquina. Para una demo real hay que generarlo desde la URL pública donde quede desplegado el front.

**Lectura (User → `features/user/scan-qr/scan-qr.ts`):**
1. Escanea con la cámara (librería `jsqr`) o el estudiante pega el link manualmente.
2. Se valida que el texto contenga `/user/responder-encuesta/`; si no, se rechaza ("Solo se permiten códigos QR de encuestas válidas").
3. Se extrae el `id` y se llama a `encuestasService.getSurveyByQR(id)`.

**Backend — contrato confirmado:**
`GET /api/surveys/qr/:surveyId`

- Es una consulta idempotente (significado: se puede aplicar varias veces seguidas y el resultado final es el mismo que si se aplicara una sola vez): valida que la encuesta exista y esté **activa/publicada**, y devuelve su estructura completa (preguntas y opciones).
- `200 OK` → el front cierra el escáner y navega a `/user/responder-encuesta/:id`.
- `404` / `403` → el front muestra un mensaje de error ("la encuesta no existe o no está disponible").
- Nota: este endpoint vive bajo `/api/surveys/...`, **no** bajo `/api/encuestas/...` como el resto de los endpoints que ya consume `encuestas.service.ts` — quedó así a propósito, avisen si eso cambia.

## 8 — Capacitor (app móvil)

Se integró Capacitor sobre este mismo proyecto. El build web se genera con `ng build` y queda en `dist/encuestas-ue/browser`, que es el `webDir` configurado en `capacitor.config.ts`.

## 9 — Pendientes

- Dashboard del Admin: en rediseño.
- `features/admin/questions/`: componente placeholder, todavía no tiene lógica ni ruta asignada. (probablemente se elimine al no hacer nada)
- Funcionalidad en User: Escanear qr