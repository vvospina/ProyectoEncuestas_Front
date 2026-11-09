import { Component, inject, OnInit, signal } from '@angular/core';
import { EncuestasService, mensajeError, MiRespuesta } from '../../../core/services/encuestas.service';

@Component({
  imports: [],
  selector: 'app-responses',
  styleUrl: './responses.scss',
  templateUrl: './responses.html',
})
export class Responses implements OnInit {
  private readonly encuestasService = inject(EncuestasService);

  protected readonly respuestas = signal<MiRespuesta[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorMensaje = signal<string | null>(null);

  ngOnInit(): void {
    this.encuestasService.listarMisRespuestas().subscribe({
      next: (respuestas) => {
        this.respuestas.set(respuestas);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMensaje.set(mensajeError(err, 'No pudimos cargar tus respuestas.'));
        this.cargando.set(false);
      },
    });
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
