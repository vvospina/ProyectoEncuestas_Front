import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EncuestasService } from '../../../core/services/encuestas.service';

@Component({
  imports: [RouterLink],
  selector: 'app-survey-success',
  styleUrl: './survey-success.scss',
  templateUrl: './survey-success.html',
})
export class SurveySuccess implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly encuestasService = inject(EncuestasService);

  protected totalQuestions = 0;

  ngOnInit(): void {
    // Camino principal: surveys.ts ya manda el total en la URL al terminar, sin
    // necesidad de otra petición al backend.
    const total = this.route.snapshot.queryParamMap.get('total');
    if (total) {
      this.totalQuestions = Number(total);
      return;
    }

    // Respaldo: si alguien entra directo a esta pantalla (por ejemplo, refrescando
    // la página o abriendo el enlace guardado), volvemos a consultar la encuesta.
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.encuestasService.obtenerEncuestaParaResponder(id).subscribe({
        next: (encuesta: any) => {
          const preguntas = encuesta.preguntas || encuesta.questions || [];
          this.totalQuestions = preguntas.length;
        },
        error: (err) => {
          console.error('Error al cargar el total de preguntas:', err);
        }
      });
    }
  }
}
