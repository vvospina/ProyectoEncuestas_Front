import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EstudianteEncuestado } from '../../../../../shared/models/estudiante-encuestado.model';

@Component({
  selector: 'app-survey-results',
  imports: [RouterLink],
  templateUrl: './survey-results.html',
  styleUrl: './survey-results.scss',
})
export class SurveyResults {
  private readonly route = inject(ActivatedRoute);

  protected readonly encuestaId = this.route.snapshot.paramMap.get('id') ?? '';

  /**
   * Datos temporales para la interfaz.
   * Cuando el backend esté listo, se tiene que ver algo así:
   * this.encuestasService.listarEstudiantesQueRespondieron(this.encuestaId)
   */
  protected readonly encuestaNombre = signal('Evaluación Docente 2026-2');

  protected readonly estudiantes = signal<EstudianteEncuestado[]>([
    {
      estudianteId: 'est-001',
      nombre: 'Luis Martinez',
      correo: 'lmarnineza@uniempresarial.edu.co',
      fechaRespuesta: '2026-08-24',
    },
    {
      estudianteId: 'est-002',
      nombre: 'Zullie Diaz',
      correo: 'zdiaz@uniempresarial.edu.co',
      fechaRespuesta: '2026-08-25',
    },
    {
      estudianteId: 'est-003',
      nombre: 'Malory Farfan',
      correo: 'mfarfan@uniempresarial.edu.co',
      fechaRespuesta: '2026-08-25',
    },
  ]);

  protected formatDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}