import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EncuestaDisponible, EstadoEncuesta } from '../../../shared/models/encuesta-disponible.model';
import { EncuestasService } from '../../../core/services/encuestas.service';
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
    private encuestasService: EncuestasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEncuestasReales();
  }

  cargarEncuestasReales(): void {
    this.encuestasService.obtenerEncuestasDisponibles().subscribe({
      next: (data) => {
        this.encuestas = data;
        this.cdr.detectChanges();
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

  abrirEscaner(): void {
    this.router.navigate(['/user/scan-qr']);
  }

  escanearQR(): void {
    this.abrirEscaner();
  }
}
