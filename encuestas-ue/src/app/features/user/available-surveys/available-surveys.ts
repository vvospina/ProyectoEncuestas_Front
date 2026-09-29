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

  /** Activa la cámara de forma nativa (compatible con Capacitor y Web) */
  async escanearQR(): Promise<void> {
    this.isScanning = true;
    this.cdr.detectChanges();

    // Damos un pequeño respiro para que el DOM pinte el div id="reader"
    setTimeout(async () => {
      try {
        this.html5QrCode = new Html5Qrcode("reader");

        const qrCodeSuccessCallback = (decodedText: string) => {
          // El QR leído exitosamente
          this.detatarEscaneo();
          this.procesarCodigoEscaneado(decodedText);
        };

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        // Inicia la cámara trasera por defecto en celulares, o la frontal/webcam en PC
        await this.html5QrCode.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback,
          () => {} // Ignoramos errores de cuadros por segundo sin QR detectado
        );

      } catch (err) {
        console.error("No se pudo acceder a la cámara:", err);
        this.isScanning = false;
        this.cdr.detectChanges();
        Swal.fire('Error de cámara', 'No pudimos acceder a la cámara de tu dispositivo. Revisa los permisos.', 'error');
      }
    }, 300);
  }

  /** Detiene la cámara y limpia el visor */
  detatarEscaneo(): void {
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      this.html5QrCode.stop().then(() => {
        this.html5QrCode?.clear();
        this.isScanning = false;
        this.cdr.detectChanges();
      }).catch(err => {
        console.error("Error al detener la cámara", err);
        this.isScanning = false;
        this.cdr.detectChanges();
      });
    } else {
      this.isScanning = false;
      this.cdr.detectChanges();
    }
  }

  /** Valida el texto extraído del QR contra el backend */
  private procesarCodigoEscaneado(codigo: string): void {
    // Si el QR contiene una URL completa (ej: http://localhost:4200/user/responder-encuesta/100), extraemos el ID final
    const surveyId = String(codigo).includes('/') ? String(codigo).split('/').pop()?.trim() : codigo.trim();

    if (!surveyId) {
      Swal.fire('QR Inválido', 'El código escaneado no contiene un ID válido.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Verificando...',
      text: 'Validando encuesta en el servidor',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.encuestasService.getSurveyByQR(surveyId).subscribe({
      next: () => {
        Swal.close();
        this.router.navigate(['/user/responder-encuesta', surveyId]);
      },
      error: () => {
        Swal.fire('No encontrada', `La encuesta con ID "${surveyId}" no existe o no está disponible.`, 'error');
      }
    });
  }
}
