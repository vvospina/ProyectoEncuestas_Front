import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { EncuestasService, mensajeError } from '../../../../core/services/encuestas.service';
import { Encuesta } from '../../../../shared/models/encuesta.models';
import { TIPOS_PREGUNTA, TipoPregunta } from '../../../../shared/models/pregunta.model';

/** Detalle de solo lectura de una encuesta, disponible en cualquier estado. */
@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly encuestasService = inject(EncuestasService);

  protected readonly encuesta = signal<Encuesta | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.encuestasService.obtenerEncuestaPorId(id).subscribe({
      next: (encuesta) => this.encuesta.set(encuesta),
      error: (err) => {
        Swal.fire('Encuesta no disponible', mensajeError(err, 'No pudimos cargar la encuesta.'), 'error');
        this.router.navigate(['/admin/surveys']);
      },
    });
  }

  protected etiquetaTipo(tipo: TipoPregunta): string {
    return TIPOS_PREGUNTA.find((item) => item.value === tipo)?.label ?? tipo;
  }

  protected formatDate(iso: string | undefined): string {
    if (!iso) return 'Sin fecha';
    return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
