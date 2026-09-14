1. Crear el Servicio Centralizado (encuestas.service.ts)

ARCHIVOS O CARPETAS MODIFICADOS:
C:\Users\zulli\reto\Reto_Encuestas\encuestas-ue\src\app\features\user\available-surveys
C:\Users\zulli\reto\Reto_Encuestas\encuestas-ue\src\app\features\user\surveys
C:\Users\zulli\reto\Reto_Encuestas\encuestas-ue\src\app\features\user\user.routes.ts
C:\Users\zulli\reto\Reto_Encuestas\encuestas-ue\src\app\shared\models
C:\Users\zulli\reto\Reto_Encuestas\encuestas-ue\src\app\app.routes.ts

Se debe crear un único servicio en Angular para manejar todas las peticiones del módulo.

Ruta sugerida: src/app/core/services/encuestas.service.ts (o en tu carpeta de servicios compartidos).

TypeScript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Encuesta } from '../../shared/models/encuesta.models';
import { EncuestaDisponible } from '../../shared/models/encuesta-disponible.model';

@Injectable({ providedIn: 'root' })
export class EncuestasService {
  // TODO: Reemplazar con la variable de entorno real (environment.apiUrl)
  private apiUrl = 'https://tu-backend.com/api/encuestas';

  constructor(private http: HttpClient) {}

  // 1. Obtiene la lista de encuestas asignadas al estudiante
  obtenerEncuestasDisponibles(): Observable<EncuestaDisponible[]> {
    return this.http.get<EncuestaDisponible[]>(`${this.apiUrl}/disponibles`);
  }

  // 2. Obtiene el detalle y las preguntas de una encuesta específica
  obtenerEncuestaPorId(id: string): Observable<Encuesta> {
    return this.http.get<Encuesta>(`${this.apiUrl}/${id}`);
  }

  // 3. Envía las respuestas finales al backend
  enviarRespuestas(idEncuesta: string, respuestas: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idEncuesta}/respuestas`, respuestas);
  }
}
2. Integración: Pantalla "Encuestas Disponibles"
Archivo a modificar: src/app/features/user/available-surveys/available-surveys.ts

Paso A: Inyectar el servicio en el constructor

TypeScript
import { EncuestasService } from '../../../core/services/encuestas.service';

constructor(
  private router: Router,
  private encuestasService: EncuestasService // <- Nueva inyección
) {}
Paso B: Reemplazar el Mock en el ngOnInit
Eliminar el método cargarEncuestasMock() por completo y modificar la inicialización:

TypeScript
ngOnInit(): void {
  this.encuestasService.obtenerEncuestasDisponibles().subscribe({
    next: (data) => {
      this.encuestas = data;
    },
    error: (err) => {
      console.error('Error al cargar encuestas disponibles', err);
    }
  });
}
3. Integración: Pantalla "Responder Encuesta"
Archivo a modificar: src/app/features/user/surveys/surveys.ts

Aquí debemos leer el ID de la encuesta desde la URL (ej. /user/responder-encuesta/enc-001) para pedirle al backend los datos correctos.

Paso A: Inyectar Router, ActivatedRoute y el Servicio

TypeScript
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../../core/services/encuestas.service';

constructor(
  private route: ActivatedRoute,
  private router: Router,
  private encuestasService: EncuestasService
) {}
Paso B: Leer el ID y cargar la encuesta
Eliminar cargarEncuestaMock() y actualizar ngOnInit:

TypeScript
ngOnInit(): void {
  // Capturamos el ID dinámico que viene en la URL
  const idEncuesta = this.route.snapshot.paramMap.get('id');

  if (idEncuesta) {
    this.encuestasService.obtenerEncuestaPorId(idEncuesta).subscribe({
      next: (data) => {
        this.encuesta = data;
      },
      error: (err) => {
        console.error('Error al cargar la encuesta', err);
        this.router.navigate(['/user/available-surveys']); // Redirige si hay error
      }
    });
  }
}
Paso C: Conectar el botón "FINALIZAR"
Actualizar el método finalizar() para enviar el JSON de respuestas al Backend y mostrar el SweetAlert2 sólo cuando el servidor responda con éxito.

TypeScript
finalizar(): void {
  const payload = {
    respuestas: this.respuestasGuardadas
  };

  this.encuestasService.enviarRespuestas(this.encuesta.id, payload).subscribe({
    next: () => {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '¡Respuestas guardadas con éxito!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      
      // Opcional: Redirigir al usuario de vuelta al listado tras finalizar
      setTimeout(() => this.router.navigate(['/user/available-surveys']), 1500);
    },
    error: (err) => {
      Swal.fire('Error', 'Hubo un problema al enviar la encuesta', 'error');
      console.error(err);
    }
  });
}
4. ¿Qué NO se debe modificar?
Los archivos HTML (.html) y SCSS (.scss) permanecen intactos. Toda la interpolación ({{ }}), las validaciones visuales, el progreso y las directivas están conectadas directamente a las variables TypeScript.

Las variables de estado como indicePreguntaActual, respuestasGuardadas o los métodos get (ej. esUltimaPregunta) no deben ser borrados, ya que controlan la interfaz del usuario.

Asegurarse de que el JSON que devuelva el Backend coincida exactamente con las interfaces EncuestaDisponible y Encuesta definidas en la carpeta shared/models/. De lo contrario, se requerirá un mapeo de datos en el Servicio.
