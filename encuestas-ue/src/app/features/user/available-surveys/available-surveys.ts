import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EncuestaDisponible, EstadoEncuesta } from '../../../shared/models/encuesta-disponible.model';
import { EncuestasService } from '../../../core/services/encuestas.service'; // <- Servicio inyectado
import Swal from 'sweetalert2';

@Component({
  selector: 'app-available-surveys',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './available-surveys.html',
  styleUrls: ['./available-surveys.scss']
})
export class AvailableSurveysComponent implements OnInit {

  encuestas: EncuestaDisponible[] = [];

  constructor(
    private router: Router,
    private encuestasService: EncuestasService, //  Inyección del servicio
    private cdr: ChangeDetectorRef // Lo inyectamos en el constructor
  ) {}

  ngOnInit(): void {
    this.cargarEncuestasReales();
  }

  cargarEncuestasReales(): void {
    // Consultamos al backend  las encuestas de la base de datos
    this.encuestasService.obtenerEncuestasDisponibles().subscribe({
      next: (data) => {
        this.encuestas = data;
        this.cdr.detectChanges(); //  Obligamos a Angular a mostrar las tarjetas que ya llegaron
      },
      error: (err) => {
        console.error('Error al cargar encuestas desde la base de datos:', err);
      }
    });
  }

  responderEncuesta(id: string): void {
  const encuesta = this.encuestas.find(e => e.id === id);
  if (encuesta?.completada) {
    Swal.fire('Encuesta completada', 'Ya respondiste esta encuesta. Solo se permite un intento.', 'info');
    return;
  }
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
