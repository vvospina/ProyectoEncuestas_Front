import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Encuesta } from '../../../shared/models/encuesta.models';

@Component({
  selector: 'app-surveys',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './surveys.html',
  styleUrls: ['./surveys.scss']
})
export class SurveysComponent implements OnInit {
  encuesta!: Encuesta;
  indicePreguntaActual = 0;
  opcionesCalificacion = [1, 2, 3, 4, 5];
  respuestasGuardadas: { [preguntaId: string]: number } = {};

  ngOnInit(): void {
    this.cargarEncuestaMock();
  }

  cargarEncuestaMock(): void {
    this.encuesta = {
      id: 'enc-001',
      titulo: 'Evaluación del profesor',
      profesor: {
        id: 'prof-01',
        nombre: 'Carlos Martínez',
        estado: 'Activo',
        categoria: 'Profesores'
      },
      preguntas: [
        { id: 'q1', texto: 'El profesor explica claramente los temas tratados durante la clase.', tipo: 'Escala 1 - 5' },
        { id: 'q2', texto: 'El profesor resuelve las dudas de manera oportuna.', tipo: 'Escala 1 - 5' },
        { id: 'q3', texto: 'El material de apoyo es útil y actualizado.', tipo: 'Escala 1 - 5' }
      ]
    };
  }

  get respuestaSeleccionada(): number | null {
    if (!this.encuesta) return null;
    const idPreguntaActual = this.encuesta.preguntas[this.indicePreguntaActual].id;
    return this.respuestasGuardadas[idPreguntaActual] || null;
  }

  get numeroPreguntaVisual(): number {
    return this.indicePreguntaActual + 1;
  }

  get progresoPorcentaje(): number {
    if (!this.encuesta) return 0;
    return (this.numeroPreguntaVisual / this.encuesta.preguntas.length) * 100;
  }

  get esUltimaPregunta(): boolean {
    return !!this.encuesta && this.indicePreguntaActual === this.encuesta.preguntas.length - 1;
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
    console.log('Respuestas enviadas:', this.respuestasGuardadas);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: '¡Los datos se han guardado con éxito!',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: false,
    });
  }
}
