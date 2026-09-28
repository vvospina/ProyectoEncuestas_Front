import { Component, computed, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QrService } from '../../../core/services/qr.service';
import { EstadoEncuestaAdmin, ESTADOS_ENCUESTA_ADMIN } from '../../../shared/models/estado-encuesta-admin.model';

interface Survey {
  id: string;
  name: string;
  description: string;
  teacher: string;
  questions: number;
  status: EstadoEncuestaAdmin;
  createdAt: string;
}

@Component({
  selector: 'app-surveys',
  imports: [RouterLink],
  templateUrl: './surveys.html',
  styleUrl: './surveys.scss',
})
export class Surveys {
  protected readonly estados = ESTADOS_ENCUESTA_ADMIN;
  private readonly qrService = inject(QrService);

  protected readonly selectedStatus = signal('TODOS');
  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');

  // ── Modal de código QR
  protected readonly qrSurvey = signal<Survey | null>(null);
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly qrLoading = signal(false);

  protected readonly surveys = signal<Survey[]>([
    {
      id: 'survey-001',
      name: 'Evaluación Docente 2026-2',
      description: 'Evaluación de la experiencia académica y docente.',
      teacher: 'Carlos Pérez',
      questions: 10,
      status: 'PUBLICADA',
      createdAt: '2026-08-23',
    },
    {
      id: 'survey-002',
      name: 'Satisfacción Académica',
      description: 'Encuesta para conocer la satisfacción de los estudiantes.',
      teacher: 'María López',
      questions: 8,
      status: 'BORRADOR',
      createdAt: '2026-08-22',
    },
    {
      id: 'survey-003',
      name: 'Evaluación del Curso',
      description: 'Evaluación general del desarrollo del curso.',
      teacher: 'Andrés Gómez',
      questions: 12,
      status: 'INACTIVA',
      createdAt: '2026-08-18',
    },
  ]);

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
