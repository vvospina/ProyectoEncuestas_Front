import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Encuesta } from '../../shared/models/encuesta.models';
import { EstadoEncuestaAdmin } from '../../shared/models/estado-encuesta-admin.model';
import { environment } from '../../../environment/environment';
import { TipoPregunta } from '../../shared/models/pregunta.model';
import { EstudianteEncuestado } from '../../shared/models/estudiante-encuestado.model';
import { RespuestaPregunta } from '../../shared/models/respuesta-pregunta.model';

export interface CrearEncuestaPayload {
  titulo: string;
  descripcion: string;
  estado: EstadoEncuestaAdmin;
  preguntas: {
    texto: string;
    tipo: TipoPregunta;
    requerida: boolean;
    displayOrder: number;
    estado: 'ACTIVA' | 'INACTIVA';
    opciones?: string[];
  }[];
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

    /** Estudiantes que ya respondieron una encuesta específica. */
  listarEstudiantesQueRespondieron(encuestaId: string): Observable<EstudianteEncuestado[]> {
    return this.http.get<EstudianteEncuestado[]>(`${this.apiUrl}/${encuestaId}/estudiantes`);
  }

  /** Respuestas de un estudiante puntual para una encuesta, con filtro de fechas opcional. */
  obtenerRespuestasEstudiante(
    encuestaId: string,
    estudianteId: string,
    filtros?: { desde?: string; hasta?: string },
  ): Observable<RespuestaPregunta[]> {
    let params = new HttpParams();
    if (filtros?.desde) params = params.set('desde', filtros.desde);
    if (filtros?.hasta) params = params.set('hasta', filtros.hasta);

    return this.http.get<RespuestaPregunta[]>(
      `${this.apiUrl}/${encuestaId}/estudiantes/${estudianteId}/respuestas`,
      { params },
    );
  }
}