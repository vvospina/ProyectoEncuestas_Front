# Cambios de refactorización visual y modelos

## Autenticación

- Se eliminó de la vista de inicio de sesión el acceso visual con Microsoft y sus elementos asociados.
- El formulario de registro ahora captura `name`, `email` y `password`; la confirmación de contraseña queda como control auxiliar de validación.
- Se conservaron los componentes standalone y el contrato REST existente de `AuthService`; el nombre se adapta al parámetro actual del servicio.
- Se ajustaron las tarjetas de login y registro a clases de Bootstrap con bordes redondeados y sombras suaves.
- Los requests REST de autenticación usan `name`, `email` y `password`, alineados con la tabla `users`; el backend debe crear el hash y asignar estado/rol.
- Los errores de registro ahora distinguen una falla de conexión de los mensajes devueltos por la API.

## Dashboard administrativo

- Se reemplazaron los controles anteriores por un campo de fecha y un selector de encuestas con clases de Bootstrap 5.
- El campo de fecha filtra localmente las opciones por `created_at` y limpia una selección que ya no corresponda.
- Las tarjetas KPI y de gráficos usan `shadow-sm` y `rounded-3`, con bordes y colores vinculados a las variables globales.
- Se añadió `EncuestaDashboard` para representar los mocks usando `survey_id`, `title`, `created_at`, `close_date` y `status`, sin alterar el modelo usado por los servicios existentes.

## Alcance

Los datos de KPIs y gráficos siguen siendo demostrativos; el selector y el filtro temporal preparan la vista para una futura integración con datos reales.