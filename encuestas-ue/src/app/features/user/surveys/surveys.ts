import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Encuesta } from '../../../shared/models/encuesta.models';
import { Pregunta } from '../../../shared/models/pregunta.model';
import { DetalleRespuesta, EncuestasService, mensajeError } from '../../../core/services/encuestas.service';

@Component({
  selector: 'app-surveys',
  standalone: true,
  imports: [],
  templateUrl: './surveys.html',
  styleUrls: ['./surveys.scss']
})
export class SurveysComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly encuestasService = inject(EncuestasService);

  encuesta = signal<Encuesta | null>(null);
  enviando = signal(false);
  indicePreguntaActual = signal(0);

  /** Opciones elegidas por pregunta (escala y selección múltiple). */
  private readonly opcionesElegidas = signal<Record<string, number[]>>({});
  /** Texto escrito por pregunta (respuesta abierta). */
  private readonly textos = signal<Record<string, string>>({});

  preguntas = computed<Pregunta[]>(() => (this.encuesta()?.preguntas ?? []).filter((p) => p.estado === 'ACTIVA'));
  preguntaActual = computed<Pregunta | null>(() => this.preguntas()[this.indicePreguntaActual()] ?? null);
  numeroPreguntaVisual = computed(() => this.indicePreguntaActual() + 1);
  progresoPorcentaje = computed(() => (this.numeroPreguntaVisual() / (this.preguntas().length || 1)) * 100);
  esUltimaPregunta = computed(() => this.indicePreguntaActual() === this.preguntas().length - 1);
  esPrimeraPregunta = computed(() => this.indicePreguntaActual() === 0);

  /** Una pregunta opcional se puede dejar en blanco. */
  puedeAvanzar = computed(() => {
    const pregunta = this.preguntaActual();
    return !!pregunta && (!pregunta.requerida || this.tieneRespuesta(pregunta));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.encuestasService.obtenerEncuestaPorId(id).subscribe({
      next: (encuesta) => {
        if (encuesta.respondida) {
          Swal.fire('Encuesta ya respondida', 'Cada encuesta se puede responder una sola vez.', 'info');
          this.router.navigate(['/user/available-surveys']);
          return;
        }
        this.encuesta.set(encuesta);
      },
      error: (err) => {
        Swal.fire('Encuesta no disponible', mensajeError(err, 'No pudimos cargar la encuesta.'), 'error');
        this.router.navigate(['/user/available-surveys']);
      },
    });
  }

  estaElegida(preguntaId: string, opcionId: number): boolean {
    return (this.opcionesElegidas()[preguntaId] ?? []).includes(opcionId);
  }

  textoDe(preguntaId: string): string {
    return this.textos()[preguntaId] ?? '';
  }

  /** En escala solo se elige una opción; en selección múltiple se pueden marcar varias. */
  elegirOpcion(pregunta: Pregunta, opcionId: number): void {
    this.opcionesElegidas.update((actuales) => {
      const elegidas = actuales[pregunta.id] ?? [];
      let nuevas = [opcionId];
      if (pregunta.tipo === 'SELECCION_MULTIPLE') {
        nuevas = elegidas.includes(opcionId) ? elegidas.filter((id) => id !== opcionId) : [...elegidas, opcionId];
      }
      return { ...actuales, [pregunta.id]: nuevas };
    });
  }

  escribirTexto(preguntaId: string, event: Event): void {
    const valor = (event.target as HTMLTextAreaElement).value;
    this.textos.update((actuales) => ({ ...actuales, [preguntaId]: valor }));
  }

  siguienteOFinalizar(): void {
    if (this.esUltimaPregunta()) {
      this.finalizar();
    } else {
      this.indicePreguntaActual.update((indice) => indice + 1);
    }
  }

  anterior(): void {
    if (!this.esPrimeraPregunta()) {
      this.indicePreguntaActual.update((indice) => indice - 1);
    }
  }

  private tieneRespuesta(pregunta: Pregunta): boolean {
    if (pregunta.tipo === 'ABIERTA') {
      return this.textoDe(pregunta.id).trim() !== '';
    }
    return (this.opcionesElegidas()[pregunta.id] ?? []).length > 0;
  }

  private construirDetalles(): DetalleRespuesta[] {
    return this.preguntas().flatMap((pregunta): DetalleRespuesta[] => {
      if (pregunta.tipo === 'ABIERTA') {
        const texto = this.textoDe(pregunta.id).trim();
        return texto ? [{ preguntaId: pregunta.id, texto }] : [];
      }
      return (this.opcionesElegidas()[pregunta.id] ?? []).map((opcionId) => ({ preguntaId: pregunta.id, opcionId }));
    });
  }

  private finalizar(): void {
    const encuesta = this.encuesta();
    if (!encuesta) return;

    const respondidas = this.preguntas().filter((pregunta) => this.tieneRespuesta(pregunta)).length;
    this.enviando.set(true);

    this.encuestasService.enviarRespuestas(encuesta.id, this.construirDetalles()).subscribe({
      next: () => {
        this.router.navigate(['/user/responder-encuesta', encuesta.id, 'completada'], {
          state: { titulo: encuesta.titulo, total: this.preguntas().length, respondidas },
        });
      },
      error: (err) => {
        this.enviando.set(false);
        Swal.fire('No se pudo enviar', mensajeError(err, 'Hubo un problema al enviar la encuesta.'), 'error');
        if (err?.status === 409) {
          this.router.navigate(['/user/available-surveys']);
        }
      },
    });
  }
}
