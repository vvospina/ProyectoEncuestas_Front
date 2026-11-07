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

/**
 * Forma que devuelve GET /surveys/:id/statistics del backend.
 * - totalSubmissions: cuántos usuarios respondieron la encuesta
 * - questionsSummary: resumen por cada pregunta activa
 */
export interface EstadisticasEncuesta {
  surveyId: number;
  totalSubmissions: number;
  questionsSummary: {
    questionId: number;
    questionText: string;
    questionType: string;  // 'Escala' | 'Abierta' | 'Seleccion Multiple'
    totalAnswers: number;
    // Solo para Escala y Selección Múltiple: { 'Opción': conteo }
    optionsCount?: { [optionText: string]: number };
    // Solo para Abierta: lista de textos libres
    openAnswers?: string[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class EncuestasService {
  private readonly apiUrl = `${environment.apiUrl}/surveys`;

  constructor(private readonly http: HttpClient) { }

  /**
   * Construye las opciones HTTP (headers + params).
   * El token se lee desde localStorage donde lo guardó el AuthService al hacer login.
   */
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

  /**
   * Trae las encuestas activas (status=1) del backend y las adapta
   * al modelo EncuestaDisponible que usa la vista del estudiante.
   */
  obtenerEncuestasDisponibles(): Observable<EncuestaDisponible[]> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id ?? user.userId;
    const params = userId ? new HttpParams().set('userId', String(userId)) : undefined;

    return this.http.get<any>(this.apiUrl, this.getOptions(params)).pipe(
      map(response => {
        // El backend devuelve un array directo o un objeto con propiedad data/encuestas
        const lista = Array.isArray(response) ? response : (response?.data || response?.encuestas || response?.items || []);

        return lista.map((item: any) => {
          // El backend usa `id` (no surveyId) en la lista
          const id = item.id ?? item.surveyId ?? item.survey_id;
          const estadoBackend = item.status;
          // status=1 → activa/publicada, cualquier otro → pendiente/inactiva
          const activa = Number(estadoBackend) === 1;

          return {
            id: id?.toString(),
            titulo: item.name ?? item.title ?? item.titulo,
            subtitulo: 'Asignación General',
            iconoSubtitulo: 'assignment',
            estado: item.completed ? 'COMPLETADO' : (activa ? 'DISPONIBLE' : 'PENDIENTE'),
            descripcion: item.description || item.descripcion || 'Sin descripción',
            totalPreguntas: item.totalQuestions ?? item.questions?.length ?? 0,
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

  /**
   * Para la vista admin: trae todas las encuestas sin importar su estado.
   */
  obtenerEncuestasAdmin(): Observable<any[]> {
    const params = new HttpParams().set('includeInactive', 'true');
    return this.http.get<any>(this.apiUrl, this.getOptions(params)).pipe(
      map(response => Array.isArray(response) ? response : (response?.data || []))
    );
  }

  /**
   * Envía las respuestas de un estudiante a una encuesta.
   * El payload debe incluir surveyId, userId y details[].
   */
  enviarRespuestas(idEncuesta: string, respuestas: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idEncuesta}/responses`, respuestas, this.getOptions());
  }

  // ==========================================
  // MÉTODOS DE ADMINISTRACIÓN DE ENCUESTAS
  // ==========================================

  /**
   * Convierte el tipo de pregunta del frontend al formato que espera el backend.
   * Frontend: 'ESCALA' | 'ABIERTA' | 'SELECCION_MULTIPLE'
   * Backend:  'Escala' | 'Abierta' | 'Seleccion Multiple'
   */
  private aTipoBackend(tipo: string): string {
    switch (tipo) {
      case 'ESCALA': return 'Escala';
      case 'ABIERTA': return 'Abierta';
      default: return 'Seleccion Multiple';
    }
  }

  /**
   * Transforma el payload del formulario frontend al formato que acepta el backend.
   * Los campos cambian de nombre: titulo→title, descripcion→description, etc.
   */
  private aPayloadBackend(payload: CrearEncuestaPayload) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      title: payload.titulo,
      description: payload.descripcion,
      userId: user.id ?? user.userId,
      questions: (payload.preguntas || [])
        .filter(p => p.estado === 'ACTIVA')
        .map(p => {
          // Las preguntas de Escala siempre tienen opciones 1 al 5
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

  /**
   * Carga la encuesta con todas sus preguntas y opciones para que el estudiante
   * pueda responderla. Adapta los campos del backend al formato que usa el template.
   *
   * CORRECCIÓN: el backend devuelve `id` en la encuesta y en las preguntas,
   * no `surveyId` ni `questionId` (esos son los nombres de la entidad TypeORM,
   * pero el Adapter los mapea a `id` antes de devolverlos).
   */
  obtenerEncuestaParaResponder(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getOptions()).pipe(
      map(s => ({
        // El backend devuelve `id` en la respuesta de GET /surveys/:id
        id: String(s.id ?? s.surveyId),
        titulo: s.name ?? s.title,
        descripcion: s.description,
        profesor: { nombre: '' },
        preguntas: (s.questions || []).map((q: any) => ({
          // Las preguntas también devuelven `id`
          id: String(q.id ?? q.questionId),
          enunciado: q.questionText,
          texto: q.questionText,
          tipo: q.questionType,
          requerida: q.isRequired ?? q.required,
          displayOrder: q.displayOrder,
          opciones: (q.options || []).map((o: any) => ({
            // Las opciones devuelven `id`
            id: o.id ?? o.optionId,
            texto: o.optionText
          }))
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

  /**
   * CORRECCIÓN: el endpoint /estudiantes no existe en el backend.
   * Usamos GET /surveys/:id/responses que devuelve todas las respuestas
   * con la info del usuario (userName, userId) y las mapeamos al modelo
   * EstudianteEncuestado que espera la vista survey-results.
   */
  listarEstudiantesQueRespondieron(encuestaId: string): Observable<EstudianteEncuestado[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${encuestaId}/responses`, this.getOptions()).pipe(
      map(responses => {
        // Cada respuesta del backend tiene: surveyResponseId, userId, userName, submittedAt, details[]
        // Agrupamos por userId para mostrar un registro por estudiante (no uno por envío)
        const porEstudiante = new Map<number, EstudianteEncuestado>();

        responses.forEach((r: any) => {
          const uid = r.userId;
          if (!porEstudiante.has(uid)) {
            porEstudiante.set(uid, {
              // El modelo EstudianteEncuestado usa string para el id
              estudianteId: String(uid),
              nombre: r.userName || 'Anónimo',
              correo: r.userEmail || '',
              // submittedAt viene como ISO string del backend
              fechaRespuesta: r.submittedAt ? r.submittedAt.split('T')[0] : ''
            });
          }
        });

        return Array.from(porEstudiante.values());
      })
    );
  }

  /**
   * Respuestas detalladas de un estudiante para una encuesta.
   * El backend no tiene este endpoint específico, así que filtramos
   * desde GET /surveys/:id/responses buscando el userId del estudiante.
   */
  obtenerRespuestasEstudiante(
    encuestaId: string,
    estudianteId: string,
    filtros?: { desde?: string; hasta?: string },
  ): Observable<RespuestaPregunta[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${encuestaId}/responses`, this.getOptions()).pipe(
      map(responses => {
        // Filtramos las respuestas del estudiante específico
        const respuestaEstudiante = responses.find(
          (r: any) => String(r.userId) === String(estudianteId)
        );

        if (!respuestaEstudiante) return [];

        // Filtramos por fecha si vienen los parámetros
        const fecha = respuestaEstudiante.submittedAt
          ? respuestaEstudiante.submittedAt.split('T')[0]
          : '';

        if (filtros?.desde && fecha < filtros.desde) return [];
        if (filtros?.hasta && fecha > filtros.hasta) return [];

        // Mapeamos cada detalle al modelo RespuestaPregunta del frontend
        return (respuestaEstudiante.details || []).map((d: any) => ({
          preguntaId: String(d.questionId),
          preguntaTexto: d.questionText || '',
          tipoPregunta: d.questionType || 'ABIERTA',
          // Para Escala/Selección: el texto de la opción. Para Abierta: el texto libre.
          respuesta: d.optionText || d.responseText || '',
          fechaRespuesta: fecha
        } as RespuestaPregunta));
      })
    );
  }

  /**
   * Usado por el escáner de QR: valida que la encuesta exista y esté activa,
   * devuelve su estructura completa (preguntas y opciones).
   */
  getSurveyByQR(surveyId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${surveyId}`, this.getOptions());
  }

  /**
   * NUEVO: Obtiene estadísticas ya calculadas por el backend.
   * Endpoint: GET /surveys/:id/statistics
   * El backend devuelve conteos por opción para Escala/Selección y
   * las respuestas abiertas para preguntas tipo Abierta.
   */
  obtenerEstadisticas(encuestaId: string): Observable<EstadisticasEncuesta> {
    return this.http.get<EstadisticasEncuesta>(
      `${this.apiUrl}/${encuestaId}/statistics`,
      this.getOptions()
    );
  }

  /** @deprecated Usar obtenerEstadisticas() en su lugar */
  obtenerResultadosBrutos(encuestaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${encuestaId}/responses`, this.getOptions());
  }
}
