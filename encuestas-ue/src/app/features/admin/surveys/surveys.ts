import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QrService } from '../../../core/services/qr.service';
import { EncuestasService, mensajeError } from '../../../core/services/encuestas.service';
import { Observable } from 'rxjs';
import { EstadoEncuestaAdmin, ESTADOS_ENCUESTA_ADMIN } from '../../../shared/models/estado-encuesta-admin.model';

interface Survey {
  id: string;
  name: string;
  description: string;
  questions: number;
  responses: number;
  status: EstadoEncuestaAdmin;
  /** Formato ISO 'YYYY-MM-DD' para poder comparar fechas fácilmente. */
  createdAt: string;
}

@Component({
  selector: 'app-surveys',
  imports: [RouterLink],
  templateUrl: './surveys.html',
  styleUrl: './surveys.scss',
})
export class Surveys implements OnInit {
  protected readonly estados = ESTADOS_ENCUESTA_ADMIN;
  private readonly qrService = inject(QrService);
  private readonly encuestasService = inject(EncuestasService);

  protected readonly errorMensaje = signal<string | null>(null);

  protected readonly selectedStatus = signal('TODOS');
  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');

  // ── Modal de código QR
  protected readonly qrSurvey = signal<Survey | null>(null);
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly qrLoading = signal(false);

  protected readonly surveys = signal<Survey[]>([]);

  protected readonly filteredSurveys = computed(() => {
    const status = this.selectedStatus();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    return this.surveys().filter((survey) => {
      const matchesStatus = status === 'TODOS' || survey.status === status;
      const matchesDesde = !desde || survey.createdAt >= desde;
      const matchesHasta = !hasta || survey.createdAt <= hasta;

      return matchesStatus && matchesDesde && matchesHasta;
    });
  });

  ngOnInit(): void {
    this.cargarEncuestas();
  }

  private cargarEncuestas(): void {
    this.encuestasService.listarEncuestas().subscribe({
      next: (encuestas) =>
        this.surveys.set(
          encuestas.map((encuesta) => ({
            id: encuesta.id,
            name: encuesta.titulo,
            description: encuesta.descripcion ?? '',
            questions: encuesta.totalPreguntas ?? 0,
            responses: encuesta.totalRespuestas ?? 0,
            status: encuesta.estado ?? 'BORRADOR',
            createdAt: encuesta.fechaCreacion ?? '',
          })),
        ),
      error: (err) => this.errorMensaje.set(mensajeError(err, 'No pudimos cargar las encuestas.')),
    });
  }

  private aplicarCambio(cambio: Observable<unknown>): void {
    this.errorMensaje.set(null);
    cambio.subscribe({
      next: () => this.cargarEncuestas(),
      error: (err) => this.errorMensaje.set(mensajeError(err, 'No pudimos cambiar el estado de la encuesta.')),
    });
  }

  protected publicar(survey: Survey): void {
    this.aplicarCambio(this.encuestasService.publicarEncuesta(survey.id));
  }

  protected volverABorrador(survey: Survey): void {
    this.aplicarCambio(this.encuestasService.volverABorrador(survey.id));
  }

  protected inactivar(survey: Survey): void {
    this.aplicarCambio(this.encuestasService.desactivarEncuesta(survey.id));
  }

  protected reactivar(survey: Survey): void {
    this.aplicarCambio(this.encuestasService.reactivarEncuesta(survey.id));
  }

  protected updateStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value);
  }

  protected updateFechaDesde(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaDesde.set(input.value);
  }

  protected updateFechaHasta(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaHasta.set(input.value);
  }

  protected limpiarFechas(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  /** Convierte 'YYYY-MM-DD' a un texto legible: '23 ago 2026'. */
  protected formatDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /** Genera el código QR que apunta a la pantalla donde el estudiante responde esta encuesta. */
  protected async generarQr(survey: Survey): Promise<void> {
    this.qrSurvey.set(survey);
    this.qrDataUrl.set(null);
    this.qrLoading.set(true);

    try {
      const url = `${window.location.origin}/user/responder-encuesta/${survey.id}`;
      const dataUrl = await this.qrService.generar(url);
      this.qrDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Error al generar el código QR', err);
    } finally {
      this.qrLoading.set(false);
    }
  }

  protected cerrarQr(): void {
    this.qrSurvey.set(null);
    this.qrDataUrl.set(null);
  }

  protected descargarQr(): void {
    const dataUrl = this.qrDataUrl();
    const survey = this.qrSurvey();
    if (!dataUrl || !survey) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-encuesta-${survey.id}.png`;
    link.click();
  }
}