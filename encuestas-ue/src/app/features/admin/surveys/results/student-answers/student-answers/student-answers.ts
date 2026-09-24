import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RespuestaPregunta } from '../../../../../../shared/models/respuesta-pregunta.model'

@Component({
  selector: 'app-student-answers',
  imports: [RouterLink],
  templateUrl: './student-answers.html',
  styleUrl: './student-answers.scss',
})
export class StudentAnswers {
  private readonly route = inject(ActivatedRoute);

  protected readonly encuestaId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly estudianteId = this.route.snapshot.paramMap.get('studentId') ?? '';

  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');

  /**
   * Datos temporales para construir la interfaz.
   * Cuando el backend esté listo, se tendrá que ver algo así:
   * this.encuestasService.obtenerRespuestasEstudiante(this.encuestaId, this.estudianteId, { desde, hasta })
   */
  protected readonly estudianteNombre = signal('Laura Ramírez');
  protected readonly estudianteCorreo = signal('laura.ramirez@uniempresarial.edu.co');

  protected readonly respuestas = signal<RespuestaPregunta[]>([
    {
      preguntaId: 'preg-001',
      preguntaTexto: 'El docente demuestra dominio del tema impartido.',
      tipoPregunta: 'ESCALA',
      respuesta: '5',
      fechaRespuesta: '2026-08-24',
    },
    {
      preguntaId: 'preg-002',
      preguntaTexto: '¿Qué aspecto de la metodología del docente destacarías?',
      tipoPregunta: 'ABIERTA',
      respuesta: 'Explica con ejemplos de la vida real y resuelve dudas con paciencia.',
      fechaRespuesta: '2026-08-24',
    },
    {
      preguntaId: 'preg-003',
      preguntaTexto: '¿Con qué frecuencia el docente llegó puntual a clase?',
      tipoPregunta: 'SELECCION_MULTIPLE',
      respuesta: 'Siempre',
      fechaRespuesta: '2026-08-24',
    },
  ]);

  protected readonly respuestasFiltradas = computed(() => {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    return this.respuestas().filter((respuesta) => {
      const matchesDesde = !desde || respuesta.fechaRespuesta >= desde;
      const matchesHasta = !hasta || respuesta.fechaRespuesta <= hasta;
      return matchesDesde && matchesHasta;
    });
  });

  protected updateFechaDesde(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaDesde.set(input.value);
  }

  protected updateFechaHasta(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaHasta.set(input.value);
  }

  protected limpiarFechas(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  protected etiquetaTipo(tipo: string): string {
    switch (tipo) {
      case 'ESCALA':
        return 'Escala 1 - 5';
      case 'ABIERTA':
        return 'Respuesta abierta';
      case 'SELECCION_MULTIPLE':
        return 'Selección múltiple';
      default:
        return tipo;
    }
  }

  protected formatDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}