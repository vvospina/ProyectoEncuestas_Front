import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EncuestaDisponible, EstadoEncuesta } from '../../../shared/models/encuesta-disponible.model';
import { EncuestasService } from '../../../core/services/encuestas.service';
import { Html5Qrcode } from 'html5-qrcode';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-available-surveys',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './available-surveys.html',
  styleUrls: ['./available-surveys.scss']
})
export class AvailableSurveysComponent implements OnInit, OnDestroy {

  encuestas: EncuestaDisponible[] = [];
  isScanning = false;
  private html5QrCode: Html5Qrcode | null = null;

  constructor(
    private router: Router,
    private encuestasService: EncuestasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEncuestasReales();
  }

  ngOnDestroy(): void {
    this.detatarEscaneo();
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
  abrirEscaner() {
    // Navega a la ruta registrada para el escáner del usuario
    this.router.navigate(['/user/scan-qr']);
  }
}
