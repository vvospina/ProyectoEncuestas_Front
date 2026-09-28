import { Component, inject, signal, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import jsQRImport from 'jsqr';
import { EncuestasService } from '../../../core/services/encuestas.service';

// Compatibilidad de importación para esbuild/Vite
const jsQR = (jsQRImport as any).default || jsQRImport;

@Component({
  selector: 'app-scan-qr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-qr.html',
  styleUrls: ['./scan-qr.scss']
})
export class ScanQrComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private encuestasService = inject(EncuestasService);
  private router = inject(Router);
  private location = inject(Location);

  activeTab = signal<'camera' | 'manual'>('camera');

  cargando = signal<boolean>(false);
  errorMessage = signal<string>('');
  camaraActiva = signal<boolean>(false);

  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;

  ngAfterViewInit() {
    this.iniciarCamara();
  }

  ngOnDestroy() {
    this.detenerCamara();
  }

  cambiarTab(tab: 'camera' | 'manual') {
    this.activeTab.set(tab);
    if (tab === 'camera') {
      setTimeout(() => this.iniciarCamara(), 100);
    } else {
      this.detenerCamara();
    }
  }
  
  volverAtras() {
    this.detenerCamara();
    
    // Si hay historial en el navegador vuelve atrás, si no, redirige a las encuestas disponibles
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user/available-surveys']);
    }
  }

  async iniciarCamara() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      video.setAttribute('playsinline', 'true');
      video.play();

      this.camaraActiva.set(true);
      requestAnimationFrame(this.escanearCuadro.bind(this));
    } catch (err) {
      this.camaraActiva.set(false);
      this.mostrarError('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
    }
  }

  escanearCuadro() {
    if (!this.camaraActiva()) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        this.detenerCamara();
        this.procesarTextoEscaneado(code.data);
        return;
      }
    }

    this.animFrameId = requestAnimationFrame(this.escanearCuadro.bind(this));
  }

  detenerCamara() {
    this.camaraActiva.set(false);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  procesarTextoEscaneado(codigoTexto: string) {
    if (this.cargando() || !codigoTexto) return;

    const textoLimpio = codigoTexto.trim();
    const patronRequerido = '/user/responder-encuesta/';

    if (textoLimpio.includes(patronRequerido)) {
      const surveyId = textoLimpio.split(patronRequerido)[1]?.replace(/\/$/, '');

      if (surveyId) {
        this.cargando.set(true);
        this.errorMessage.set('');

        this.encuestasService.getSurveyByQR(surveyId).subscribe({
          next: () => {
            this.cargando.set(false);
            this.router.navigate(['/user/responder-encuesta', surveyId]);
          },
          error: () => {
            this.cargando.set(false);
            this.mostrarError('La encuesta no existe o no está disponible.');
            this.iniciarCamara(); // Reactivar cámara tras error
          }
        });
        return;
      }
    }

    this.mostrarError('Solo se permiten códigos QR de encuestas válidas.');
  }

  private mostrarError(mensaje: string) {
    this.errorMessage.set(mensaje);
    setTimeout(() => this.errorMessage.set(''), 4000);
  }
}