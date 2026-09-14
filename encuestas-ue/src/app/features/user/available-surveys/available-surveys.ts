import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EncuestaDisponible, EstadoEncuesta } from '../../../shared/models/encuesta-disponible.model';

@Component({
  selector: 'app-available-surveys',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './available-surveys.html',
  styleUrls: ['./available-surveys.scss']
})
export class AvailableSurveysComponent implements OnInit {

  encuestas: EncuestaDisponible[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarEncuestasMock();
  }

  cargarEncuestasMock(): void {
    this.encuestas = [
      {
        id: 'enc-001',
        titulo: 'Evaluación docente',
        subtitulo: 'Profesor: Carlos Martínez',
        iconoSubtitulo: 'person',
        estado: 'DISPONIBLE',
        descripcion: 'Evaluación de desempeño correspondiente al primer semestre académico. Tu opinión es fundamental para la mejora continua.',
        totalPreguntas: 10,
        fechaTexto: 'Disponible hasta: 15 Dic',
        completada: false
      },
      {
        id: 'enc-002',
        titulo: 'Infraestructura y Servicios',
        subtitulo: 'Campus Central',
        iconoSubtitulo: 'domain',
        estado: 'PENDIENTE',
        descripcion: 'Encuesta anual sobre la calidad de las instalaciones, biblioteca, cafetería y servicios generales del campus.',
        totalPreguntas: 15,
        fechaTexto: 'Disponible hasta: 18 Dic',
        completada: false
      },
      {
        id: 'enc-003',
        titulo: 'Satisfacción Estudiantil',
        subtitulo: 'Bienestar Universitario',
        iconoSubtitulo: 'school',
        estado: 'COMPLETADO',
        descripcion: 'Evaluación de los programas de bienestar y apoyo al estudiante. Gracias por tu participación.',
        totalPreguntas: 8,
        fechaTexto: 'Completada el 10 Dic',
        completada: true
      }
    ];
  }

  responderEncuesta(id: string): void {
    // Redirige a la pantalla de la encuesta (Prueba)
    this.router.navigate(['/user/surveys', id]);
    this.router.navigate(['/user/responder-encuesta', id]);
  }

  obtenerClaseBadge(estado: EstadoEncuesta): string {
    switch (estado) {
      case 'DISPONIBLE': return 'badge-disponible';
      case 'PENDIENTE': return 'badge-pendiente';
      case 'COMPLETADO': return 'badge-completado';
    }
  }
}
