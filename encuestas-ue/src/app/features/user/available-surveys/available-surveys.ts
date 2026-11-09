import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EncuestaDisponible, EstadoEncuesta } from '../../../shared/models/encuesta-disponible.model';
import { EncuestasService, mensajeError } from '../../../core/services/encuestas.service';

@Component({
  selector: 'app-available-surveys',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './available-surveys.html',
  styleUrls: ['./available-surveys.scss']
})
export class AvailableSurveysComponent implements OnInit {
  private readonly encuestasService = inject(EncuestasService);

  encuestas = signal<EncuestaDisponible[]>([]);
  cargando = signal(true);
  errorMensaje = signal<string | null>(null);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.encuestasService.listarEncuestasDisponibles().subscribe({
      next: (encuestas) => {
        this.encuestas.set(encuestas);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMensaje.set(mensajeError(err, 'No pudimos cargar las encuestas. Intenta de nuevo.'));
        this.cargando.set(false);
      },
    });
  }

  responderEncuesta(id: string): void {
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
