import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Encuesta } from '../../shared/models/encuesta.models';
import { TipoEncuesta } from '../../shared/models/tipo-encuesta.model';
import { EstadoEncuestaAdmin } from '../../shared/models/estado-encuesta-admin.model';
import { environment } from '../../../environment/environment';

export interface CrearEncuestaPayload {
  titulo: string;
  tipo: TipoEncuesta;
  profesorId: string;
  preguntas: { texto: string; tipo: 'Escala 1 - 5' }[];
}

/** Editar usa exactamente la misma forma que crear. */
export type EditarEncuestaPayload = CrearEncuestaPayload;

export interface FiltrosEncuestas {
  busqueda?: string;
  estado?: EstadoEncuestaAdmin | 'TODOS';
}

@Injectable({ providedIn: 'root' })
export class EncuestasService {
  private readonly apiUrl = `${environment.apiUrl}/encuestas`;

  constructor(private readonly http: HttpClient) {}

  /** Crea una encuesta nueva. */
  crearEncuesta(payload: CrearEncuestaPayload): Observable<Encuesta> {
    return this.http.post<Encuesta>(this.apiUrl, payload);
  }

  /** Lista encuestas, con búsqueda y filtro de estado opcionales por query params. */
  listarEncuestas(filtros?: FiltrosEncuestas): Observable<Encuesta[]> {
    let params = new HttpParams();

    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros?.estado && filtros.estado !== 'TODOS') {
      params = params.set('estado', filtros.estado);
    }

    return this.http.get<Encuesta[]>(this.apiUrl, { params });
  }

  /** Trae el detalle completo (con preguntas) de una encuesta. */
  obtenerEncuestaPorId(id: string): Observable<Encuesta> {
    return this.http.get<Encuesta>(`${this.apiUrl}/${id}`);
  }

  /** Actualiza la información y las preguntas de una encuesta existente. */
  actualizarEncuesta(id: string, payload: EditarEncuestaPayload): Observable<Encuesta> {
    return this.http.put<Encuesta>(`${this.apiUrl}/${id}`, payload);
  }

  /** Cambia el estado de la encuesta a ACTIVA. */
  publicarEncuesta(id: string): Observable<Encuesta> {
    return this.http.patch<Encuesta>(`${this.apiUrl}/${id}/publicar`, {});
  }

  /** Cambia el estado de la encuesta a INACTIVA. */
  desactivarEncuesta(id: string): Observable<Encuesta> {
    return this.http.patch<Encuesta>(`${this.apiUrl}/${id}/desactivar`, {});
  }
}