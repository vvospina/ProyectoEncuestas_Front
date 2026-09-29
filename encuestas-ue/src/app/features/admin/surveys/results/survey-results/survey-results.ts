import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EstudianteEncuestado } from '../../../../../shared/models/estudiante-encuestado.model';
import { EncuestasService } from '../../../../../core/services/encuestas.service';
import Swal from 'sweetalert2';

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
  protected readonly encuestaNombre = signal('Detalle de Resultados');
  protected readonly estudiantes = signal<EstudianteEncuestado[]>([]);

  ngOnInit(): void {
    if (this.encuestaId) {
      this.cargarEstudiantes();
    }
  }

  private cargarEstudiantes(): void {
    this.encuestasService.listarEstudiantesQueRespondieron(this.encuestaId).subscribe({
      next: (data) => {
        this.estudiantes.set(data);
      },
      error: (err) => {
        console.error('Error al cargar estudiantes:', err);
        Swal.fire('Error', 'No se pudieron cargar los estudiantes que respondieron.', 'error');
      }
    });
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
