import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Encuesta } from '../../shared/models/encuesta.models';
import { EstadoEncuestaAdmin } from '../../shared/models/estado-encuesta-admin.model';
import { EncuestaDisponible } from '../../shared/models/encuesta-disponible.model';
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

export type EditarEncuestaPayload = CrearEncuestaPayload;

export interface FiltrosEncuestas {
  busqueda?: string;
  estado?: EstadoEncuestaAdmin | 'TODOS';
}

@Injectable({ providedIn: 'root' })
export class EncuestasService {
  private readonly apiUrl = `${environment.apiUrl}/surveys`;

  constructor(private readonly http: HttpClient) { }

  private getOptions(extraParams?: HttpParams) {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      }),
      params: extraParams
    };
  }

  // ==========================================
  // MÉTODOS PARA ESTUDIANTES / VISTAS DE USUARIO
  // ==========================================

  obtenerEncuestasDisponibles(): Observable<EncuestaDisponible[]> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id ?? user.userId;
    const params = userId ? new HttpParams().set('userId', String(userId)) : undefined;

    return this.http.get<any>(this.apiUrl, this.getOptions(params)).pipe(
      map(response => {

        const lista = Array.isArray(response) ? response : (response?.data || response?.encuestas || response?.items || []);

        return lista.map((item: any) => {
          const id = item.id ?? item.surveyId ?? item.survey_id;
          const estadoBackend = item.estado ?? item.status;
          const activa = estadoBackend === 'Activa' || estadoBackend === 'Publicada' || Number(estadoBackend) === 1;

          return {
            id: id?.toString(),
            titulo: item.titulo ?? item.title,
            subtitulo: 'Asignación General',
            iconoSubtitulo: 'assignment',
            estado: item.completed ? 'COMPLETADO' : (activa ? 'DISPONIBLE' : 'PENDIENTE'),
            descripcion: item.descripcion || item.description || 'Sin descripción',
            totalPreguntas: item.totalQuestions ?? item.preguntas?.length ?? 0,
            fechaTexto: item.completed ? 'Ya respondida' : 'Disponible ahora',
            completada: !!item.completed
          } as EncuestaDisponible;
        });
      })
    );
  }

  obtenerTodasLasEncuestas(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl, this.getOptions()).pipe(
      map(response => Array.isArray(response) ? response : (response?.data || response?.encuestas || []))
    );
  }

  obtenerEncuestasAdmin(): Observable<any[]> {
    const params = new HttpParams().set('includeInactive', 'true');
    return this.http.get<any>(this.apiUrl, this.getOptions(params)).pipe(
      map(response => Array.isArray(response) ? response : (response?.data || []))
    );
  }

  enviarRespuestas(idEncuesta: string, respuestas: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idEncuesta}/responses`, respuestas, this.getOptions());
  }

  // ==========================================
  // MÉTODOS DE ADMINISTRACIÓN DE ENCUESTAS
  // ==========================================

  private aTipoBackend(tipo: string): string {
    switch (tipo) {
      case 'ESCALA': return 'Escala';
      case 'ABIERTA': return 'Abierta';
      default: return 'Seleccion Multiple';
    }
  }

  private aPayloadBackend(payload: CrearEncuestaPayload) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      title: payload.titulo,
      description: payload.descripcion,
      userId: user.id ?? user.userId,
      questions: (payload.preguntas || [])
        .filter(p => p.estado === 'ACTIVA')
        .map(p => {
          const opciones: string[] =
            p.tipo === 'ESCALA' ? ['1', '2', '3', '4', '5'] :
              p.tipo === 'ABIERTA' ? [] :
                (p.opciones || []);

          return {
            questionText: p.texto,
            questionType: this.aTipoBackend(p.tipo),
            isRequired: p.requerida,
            displayOrder: p.displayOrder,
            options: opciones.map((texto, i) => ({ optionText: texto, displayOrder: i + 1 }))
          };
        })
    };
  }

  crearEncuesta(payload: CrearEncuestaPayload): Observable<Encuesta> {
    return this.http.post<Encuesta>(this.apiUrl, this.aPayloadBackend(payload), this.getOptions());
  }

  actualizarEncuesta(id: string, payload: EditarEncuestaPayload): Observable<Encuesta> {
    return this.http.put<Encuesta>(`${this.apiUrl}/${id}`, this.aPayloadBackend(payload), this.getOptions());
  }

  listarEncuestas(filtros?: FiltrosEncuestas): Observable<Encuesta[]> {
    let params = new HttpParams();

    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros?.estado && filtros.estado !== 'TODOS') {
      params = params.set('estado', filtros.estado);
    }

    return this.http.get<Encuesta[]>(this.apiUrl, this.getOptions(params));
  }

  obtenerEncuestaPorId(id: string): Observable<Encuesta> {
    return this.http.get<Encuesta>(`${this.apiUrl}/${id}`, this.getOptions());
  }

  obtenerEncuestaParaResponder(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getOptions()).pipe(
      map(s => ({
        id: String(s.surveyId),
        titulo: s.title,
        descripcion: s.description,
        profesor: { nombre: '' },
        preguntas: (s.questions || []).map((q: any) => ({
          id: String(q.questionId),
          enunciado: q.questionText,
          texto: q.questionText,
          tipo: q.questionType,
          requerida: q.isRequired,
          displayOrder: q.displayOrder,
          opciones: (q.options || []).map((o: any) => ({ id: o.optionId, texto: o.optionText }))
        }))
      }))
    );
  }

  publicarEncuesta(id: string): Observable<Encuesta> {
    return this.http.patch<Encuesta>(`${this.apiUrl}/${id}/publish`, {}, this.getOptions());
  }

  desactivarEncuesta(id: string): Observable<Encuesta> {
    return this.http.patch<Encuesta>(`${this.apiUrl}/${id}/deactivate`, {}, this.getOptions());
  }

  /** Estudiantes que ya respondieron una encuesta específica. */
  /** Estudiantes que ya respondieron una encuesta específica. */
  listarEstudiantesQueRespondieron(encuestaId: string): Observable<EstudianteEncuestado[]> {
    return this.http.get<EstudianteEncuestado[]>(`${this.apiUrl}/${encuestaId}/estudiantes`, this.getOptions());
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
      this.getOptions(params),
    );
  }
  /**
   * Usado por el escáner de QR: valida (en el backend) que la encuesta exista
   * y esté activa/publicada, y devuelve su estructura completa (preguntas y opciones).
   *
   * Nota: este endpoint vive bajo /api/surveys, no bajo /api/encuestas como el
   * resto de este servicio — por eso arma la URL desde environment.apiUrl
   * directamente, en vez de usar this.apiUrl.
   */
  getSurveyByQR(surveyId: string): Observable<any> {
    // Reutilizamos GET /api/surveys/:id para validar que la encuesta exista antes de abrirla
    return this.http.get<any>(`${this.apiUrl}/${surveyId}`, this.getOptions());
  }

  /** Trae todas las respuestas crudas de una encuesta para calcular estadísticas en el Dashboard */
  obtenerResultadosBrutos(encuestaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${encuestaId}/responses`, this.getOptions());
  }
}
