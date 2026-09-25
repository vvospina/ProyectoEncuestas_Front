import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({ providedIn: 'root' })
export class QrService {
  /** Genera un código QR (imagen en base64, lista para un <img src="...">) a partir de un texto o link. */
  generar(texto: string, opciones?: { width?: number; margin?: number }): Promise<string> {
    return QRCode.toDataURL(texto, {
      width: opciones?.width ?? 260,
      margin: opciones?.margin ?? 1,
    });
  }
}