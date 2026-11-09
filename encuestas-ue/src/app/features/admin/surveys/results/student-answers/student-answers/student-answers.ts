import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RespuestaPregunta } from '../../../../../../shared/models/respuesta-pregunta.model'
import { EncuestasService } from '../../../../../../core/services/encuestas.service';

@Component({
  selector: 'app-student-answers',
  imports: [RouterLink],
  templateUrl: './student-answers.html',
  styleUrl: './student-answers.scss',
})
export class StudentAnswers implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly encuestasService = inject(EncuestasService);

  protected readonly encuestaId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly estudianteId = this.route.snapshot.paramMap.get('studentId') ?? '';

  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');

  protected readonly estudianteNombre = signal('');
  protected readonly estudianteCorreo = signal('');
  protected readonly respuestas = signal<RespuestaPregunta[]>([]);

  ngOnInit(): void {
    this.encuestasService.obtenerRespuestasEstudiante(this.encuestaId, this.estudianteId).subscribe({
      next: (datos) => {
        this.estudianteNombre.set(datos.nombre);
        this.estudianteCorreo.set(datos.correo);
        this.respuestas.set(datos.respuestas);
      },
      error: (err) => console.error('Error al cargar las respuestas', err),
    });
  }

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