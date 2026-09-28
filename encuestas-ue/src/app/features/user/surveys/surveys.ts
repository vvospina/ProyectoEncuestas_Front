import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Encuesta } from '../../../shared/models/encuesta.models';
import { EncuestasService } from '../../../core/services/encuestas.service';

@Component({
  selector: 'app-surveys',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './surveys.html',
  styleUrls: ['./surveys.scss']
})
export class SurveysComponent implements OnInit {
  // Inicializamos el objeto con valores por defecto para evitar errores de "undefined" al cargar
  encuesta: Encuesta = {
    id: '',
    titulo: 'Cargando encuesta...',
    descripcion: '',
    profesor: { nombre: 'Cargando...' },
    preguntas: []
  } as any;

  indicePreguntaActual = 0;
  opcionesCalificacion = [1, 2, 3, 4, 5];
  respuestasGuardadas: { [preguntaId: string]: number } = {};
  respuestasTexto: { [preguntaId: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private encuestasService: EncuestasService
  ) {}

  ngOnInit(): void {
    const id = Object.values(this.route.snapshot.params)[0] as string | undefined;
    if (!id) {
      this.router.navigate(['/user/available-surveys']);
      return;
    }

    this.encuestasService.obtenerEncuestaParaResponder(id).subscribe({
      next: (encuesta) => {
        this.encuesta = encuesta;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar la encuesta:', err);
        Swal.fire('Error', 'No se pudo cargar la encuesta.', 'error');
      }
    });
  }

  get preguntaActual(): any {
    return this.encuesta?.preguntas?.[this.indicePreguntaActual];
  }

  get textoRespuestaActual(): string {
    const id = this.preguntaActual?.id;
    return id ? (this.respuestasTexto[id] ?? '') : '';
  }

  // Habilita SIGUIENTE/FINALIZAR: las opcionales siempre, las requeridas solo si ya tienen respuesta
  get puedeContinuar(): boolean {
    const p = this.preguntaActual;
    if (!p) return false;
    if (!p.requerida) return true;
    if (p.opciones?.length) return !!this.respuestasGuardadas[p.id];
    return !!(this.respuestasTexto[p.id] || '').trim();
  }

  actualizarTexto(valor: string): void {
    const id = this.preguntaActual?.id;
    if (id) this.respuestasTexto[id] = valor;
  }

  get respuestaSeleccionada(): number | null {
    if (!this.encuesta || !this.encuesta.preguntas || this.encuesta.preguntas.length === 0) return null;
    const idPreguntaActual = this.encuesta.preguntas[this.indicePreguntaActual].id;
    return this.respuestasGuardadas[idPreguntaActual] || null;
  }

  get numeroPreguntaVisual(): number {
    return this.indicePreguntaActual + 1;
  }

  get progresoPorcentaje(): number {
    if (!this.encuesta || !this.encuesta.preguntas || this.encuesta.preguntas.length === 0) return 0;
    return (this.numeroPreguntaVisual / this.encuesta.preguntas.length) * 100;
  }

  get esUltimaPregunta(): boolean {
    return !!this.encuesta && !!this.encuesta.preguntas && this.indicePreguntaActual === this.encuesta.preguntas.length - 1;
  }

  get esPrimeraPregunta(): boolean {
    return this.indicePreguntaActual === 0;
  }

  seleccionarCalificacion(valor: number): void {
    const idPreguntaActual = this.encuesta.preguntas[this.indicePreguntaActual].id;
    this.respuestasGuardadas[idPreguntaActual] = valor;
  }

  siguienteOFinalizar(): void {
    if (this.esUltimaPregunta) {
      this.finalizar();
    } else {
      this.indicePreguntaActual++;
    }
  }

  anterior(): void {
    if (!this.esPrimeraPregunta) {
      this.indicePreguntaActual--;
    }
  }

  finalizar(): void {
    const details: { questionId: number; optionId?: number; responseText?: string }[] = [];

    for (let i = 0; i < this.encuesta.preguntas.length; i++) {
      const p: any = this.encuesta.preguntas[i];
      const optionId = this.respuestasGuardadas[p.id];
      const texto = (this.respuestasTexto[p.id] || '').trim();

      if (optionId) {
        details.push({ questionId: Number(p.id), optionId });
      } else if (texto) {
        details.push({ questionId: Number(p.id), responseText: texto });
      } else if (p.requerida) {
        this.indicePreguntaActual = i;
        Swal.fire('Falta una respuesta', 'Responde las preguntas obligatorias antes de enviar.', 'warning');
        return;
      }
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const payload = {
      surveyId: Number(this.encuesta.id),
      userId: user.id ?? user.userId,
      details
    };

    this.encuestasService.enviarRespuestas(this.encuesta.id, payload).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: '¡Respuestas guardadas con éxito!',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: false,
        });

        setTimeout(() => this.router.navigate(['/user/available-surveys']), 1500);
      },
      error: (err: any) => {
        console.error('Error al enviar respuestas:', err);
        Swal.fire('Error', err.error?.error || 'Hubo un problema al enviar la encuesta al servidor', 'error');

      }
    });
  }
}
