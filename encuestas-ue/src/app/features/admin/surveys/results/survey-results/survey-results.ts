import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EstudianteEncuestado } from '../../../../../shared/models/estudiante-encuestado.model';
import { EncuestasService, mensajeError } from '../../../../../core/services/encuestas.service';

@Component({
  selector: 'app-survey-results',
  imports: [RouterLink],
  templateUrl: './survey-results.html',
  styleUrl: './survey-results.scss',
})
export class SurveyResults implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly encuestasService = inject(EncuestasService);

  protected readonly encuestaId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly encuestaNombre = signal('');
  protected readonly estudiantes = signal<EstudianteEncuestado[]>([]);

  ngOnInit(): void {
    this.encuestasService.obtenerEncuestaPorId(this.encuestaId).subscribe({
      next: (encuesta) => this.encuestaNombre.set(encuesta.titulo),
      error: (err) => this.encuestaNombre.set(mensajeError(err, 'No pudimos cargar la encuesta')),
    });

    this.encuestasService.listarEstudiantesQueRespondieron(this.encuestaId).subscribe({
      next: (estudiantes) => this.estudiantes.set(estudiantes),
      error: (err) => console.error('Error al cargar los estudiantes', err),
    });
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
