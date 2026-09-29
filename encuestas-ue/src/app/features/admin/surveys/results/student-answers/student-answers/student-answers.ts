import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RespuestaPregunta } from '../../../../../../shared/models/respuesta-pregunta.model';
import { EncuestasService } from '../../../../../../core/services/encuestas.service';
import Swal from 'sweetalert2';

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

  protected readonly estudianteNombre = signal('Estudiante');
  protected readonly estudianteCorreo = signal('estudiante@uniempresarial.edu.co');

  protected readonly respuestas = signal<RespuestaPregunta[]>([]);

  ngOnInit(): void {
    if (this.encuestaId && this.estudianteId) {
      this.cargarRespuestasEstudiante();
    }
  }

  private cargarRespuestasEstudiante(): void {
    const desde = this.fechaDesde() || undefined;
    const hasta = this.fechaHasta() || undefined;

    this.encuestasService.obtenerRespuestasEstudiante(this.encuestaId, this.estudianteId, { desde, hasta }).subscribe({
      next: (data) => {
        this.respuestas.set(data);
      },
      error: (err) => {
        console.error('Error al cargar respuestas del estudiante:', err);
        Swal.fire('Error', 'No se pudieron cargar las respuestas del estudiante.', 'error');
      }
    });
  }

  protected readonly respuestasFiltradas = computed(() => {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    return this.respuestas().filter((respuesta) => {
      const fechaResp = respuesta.fechaRespuesta ? respuesta.fechaRespuesta.split('T')[0] : '';
      const matchesDesde = !desde || fechaResp >= desde;
      const matchesHasta = !hasta || fechaResp <= hasta;
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
      case 'Escala':
        return 'Escala 1 - 5';
      case 'ABIERTA':
      case 'Abierta':
        return 'Respuesta abierta';
      case 'SELECCION_MULTIPLE':
      case 'Seleccion Multiple':
        return 'Selección múltiple';
      default:
        return tipo;
    }
  }

  protected formatDate(iso: string): string {
    if (!iso) return '';
    const datePart = iso.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
