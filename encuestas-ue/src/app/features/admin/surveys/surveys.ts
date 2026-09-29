import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QrService } from '../../../core/services/qr.service';
import { EncuestasService } from '../../../core/services/encuestas.service';
import { EstadoEncuestaAdmin, ESTADOS_ENCUESTA_ADMIN } from '../../../shared/models/estado-encuesta-admin.model';
import Swal from 'sweetalert2';

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
export class Surveys implements OnInit {
  protected readonly estados = ESTADOS_ENCUESTA_ADMIN;
  private readonly qrService = inject(QrService);
  private readonly encuestasService = inject(EncuestasService);

  protected readonly selectedStatus = signal('TODOS');
  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');

  // ── Modal de código QR
  protected readonly qrSurvey = signal<Survey | null>(null);
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly qrLoading = signal(false);

  // Inicializamos el arreglo vacío (ya no hay datos quemados)
  protected readonly surveys = signal<Survey[]>([]);

  ngOnInit(): void {
    this.cargarEncuestas();
  }

  private cargarEncuestas(): void {
    // CAMBIO CLAVE: Usamos obtenerEncuestasAdmin() para que envíe ?includeInactive=true
    // y el backend nos devuelva TODO, sin importar si están inactivas o en borrador.
    this.encuestasService.obtenerEncuestasAdmin().subscribe({
      next: (data: any) => {
        const encuestasReales = data.map((s: any) => ({
          id: s.surveyId || s.id,
          name: s.title || s.titulo,
          description: s.description || s.descripcion || 'Sin descripción',
          teacher: 'Admin', // El backend no devuelve profesor
          questions: s.totalQuestions || s.preguntas?.length || 0,
          status: Number(s.status) === 1 ? 'PUBLICADA' : 'INACTIVA',
          createdAt: s.createdAt ? s.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        }));
        this.surveys.set(encuestasReales);
      },
      error: (err) => {
        console.error('Error cargando encuestas:', err);
        Swal.fire('Error', 'No se pudieron cargar las encuestas de la base de datos.', 'error');
      }
    });
  }
  
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
    if (!iso) return '';
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
