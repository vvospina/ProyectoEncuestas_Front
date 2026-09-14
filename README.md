# Reto_Encuestas C:
# Estaremos trabajando todos sobre la rama 'develop-frontend' lo ideal es que a medida que vayamos trabajando, podamos ir guardando backups de lo que vayamos haciendo localmente por si se pierde o tropieza algo. !!!

## 1 -- Versiones

- **Node.js 22 o superior** Verifica con:
  ```bash
  node -v
  ```
- **Angular CLI 22**: 22.0.7
  ```bash
  npm install -g @angular/cli@22
  ```

## 2 -- Se creo el proyecto utilizando -- style=scss para poder hacer uso de variables y anidar estilos

## 3 -- Se instalo Bootstrap y Firebase

npm install bootstrap firebase
```
- `styles.scss` ya trae el `@import` de Bootstrap, así que no necesitas
  tocar `angular.json` para los estilos.
```

## 4 -- En styles.scss van a estar todos los estilos globales, se van a añadir las variables para que solo sea hacer uso de estas

## 5. Estructura de carpetas (qué va dónde)

```
src/app/
├── core/                 # Cosas que usa TODA la app (login, guards, config de firebase)
│   ├── auth/               # AuthService, guard e interceptor
│   └── config/             # Inicialización de Firebase
├── shared/               # Piezas reutilizables (botones, tarjetas, interfaces TS)
│   ├── components/
│   ├── models/             # Interfaces TS: Survey, Question, Teacher, Response...
│   └── ui/
└── features/
    ├── auth/login/       # Login
    ├── admin/            # Dashboard, encuestas, preguntas, profesores
    │   ├── dashboard/
    │   ├── surveys/
    │   ├── questions/    
    │   └── teachers/
    └── user/             # Encuestas, respuestas
        ├── surveys/
        └── responses/    
```
## 6 -- Configuración variables de entorno

Estos archivos NO vienen en el repositorio (contienen llaves reales de Firebase):

\`\`\`bash
cp src/environments/environment.example.ts src/environments/environment.ts --  apunta a un backend local (http://localhost:3000/api) y a un proyecto de Firebase de pruebas.
cp src/environments/environment.example.ts src/environments/environment.development.ts --  apunta al backend ya desplegado (https://api-encuestas.miempresa.com) y al proyecto de Firebase real.
\`\`\`

## Pedir las llaves reales de Firebase y pegarlas en esos dos archivos. !!!


## Explicación Login:

- `core/config/firebase.config.ts`: prende Firebase una sola vez.
- `core/auth/auth.service.ts`: el único lugar que habla con Firebase Auth (login con email, login con Microsoft, logout, obtener el token).
- `core/auth/auth.guard.ts`: bloquea rutas si no hay sesión iniciada.
- `core/auth/auth.interceptor.ts`: agrega el token de Firebase a cada petición HTTP que salga hacia Node.js.
- `features/auth/login/`: el formulario (HTML + Bootstrap) que usa el `AuthService`.