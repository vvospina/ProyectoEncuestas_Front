import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { concat, forkJoin, map, Observable, of, switchMap, toArray } from 'rxjs';
import { Encuesta } from '../../shared/models/encuesta.models';
import { EncuestaDisponible } from '../../shared/models/encuesta-disponible.model';
import { EstadoEncuestaAdmin } from '../../shared/models/estado-encuesta-admin.model';
import { environment } from '../../../environment/environment';
import { Pregunta, TipoPregunta } from '../../shared/models/pregunta.model';
import { EstudianteEncuestado } from '../../shared/models/estudiante-encuestado.model';
import { RespuestaPregunta } from '../../shared/models/respuesta-pregunta.model';

export interface CrearEncuestaPayload {
  titulo: string;
  descripcion: string;
  estado: EstadoEncuestaAdmin;
  fechaCierre?: string | null;
  preguntas: {
    id?: string;
    texto: string;
    tipo: TipoPregunta;
    requerida: boolean;
    displayOrder: number;
    estado: 'ACTIVA' | 'INACTIVA';
    opciones?: string[];
  }[];
}

export interface DetalleRespuesta {
  preguntaId: string;
  opcionId?: number;
  texto?: string;
}

export interface MiRespuesta {
  id: number;
  titulo: string;
  fecha: string;
  detalles: { pregunta: string; respuesta: string }[];
}

interface Sentimiento {
  positive: number;
  neutral: number;
  negative: number;
}

export interface EstadisticasEncuesta {
  totalSubmissions: number;
  totalStudents: number;
  studentsAnswered: number;
  participation: number;
  averageScore: number;
  sentiment: Sentimiento;
  questionsSummary: {
    questionId: number;
    questionText: string;
    questionType: string;
    totalAnswers: number;
    optionsCount?: Record<string, number>;
    openAnswers?: string[];
    average?: number;
    sentiment?: Sentimiento;
  }[];
}

export interface RespuestasDeEstudiante {
  nombre: string;
  correo: string;
  respuestas: RespuestaPregunta[];
}

// Formato en el que responde el backend
interface OptionApi {
  optionId: number;
  optionText: string;
  status: number;
}

interface QuestionApi {
  questionId: number;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  displayOrder: number;
  status: number;
  options?: OptionApi[];
}

interface SurveyApi {
  surveyId: number;
  title: string;
  description?: string;
  status: number;
  createdAt: string;
  closeDate?: string | null;
  questionCount?: number;
  answered?: boolean;
  responseCount?: number;
  questions?: QuestionApi[];
}

interface MyResponseApi {
  surveyResponseId: number;
  surveyTitle: string;
  submittedAt: string;
  details: { questionId: number; questionText: string; optionText?: string; responseText?: string }[];
}

interface ResponseApi {
  submittedAt: string;
  userId: number;
  userName: string;
  userEmail?: string;
  details: {
    questionId: number;
    questionText?: string;
    optionText?: string;
    responseText?: string;
  }[];
}

const ESTADOS_API: Record<number, EstadoEncuestaAdmin> = { 0: 'INACTIVA', 1: 'PUBLICADA', 2: 'BORRADOR' };

const TIPOS_API: Record<TipoPregunta, string> = {
  ESCALA: 'Escala',
  ABIERTA: 'Abierta',
  SELECCION_MULTIPLE: 'Seleccion Multiple',
};

const OPCIONES_ESCALA = ['1', '2', '3', '4', '5'];

/** Fecha 'YYYY-MM-DD' en la zona horaria del usuario (el backend guarda en UTC). */
function fechaLocal(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA');
}

/** Devuelve el mensaje de error que envió el backend, o el texto indicado si no hay ninguno. */
export function mensajeError(err: unknown, porDefecto: string): string {
  return (err as { error?: { error?: string } })?.error?.error ?? porDefecto;
}

@Injectable({ providedIn: 'root' })
export class EncuestasService {
  private readonly apiUrl = `${environment.apiUrl}/surveys`;

  constructor(private readonly http: HttpClient) {}

  /** Crea una encuesta y, si se indicó otro estado, lo aplica después de crearla como borrador. */
  crearEncuesta(payload: CrearEncuestaPayload): Observable<string> {
    const body = {
      title: payload.titulo,
      description: payload.descripcion,
      closeDate: payload.fechaCierre ?? undefined,
      questions: payload.preguntas.map((pregunta) => this.aPreguntaApi(pregunta)),
    };

    return this.http.post<{ surveyId: number }>(this.apiUrl, body).pipe(
      switchMap(({ surveyId }) => {
        const id = String(surveyId);
        if (payload.estado === 'PUBLICADA') return this.publicarEncuesta(id).pipe(map(() => id));
        if (payload.estado === 'INACTIVA') return this.desactivarEncuesta(id).pipe(map(() => id));
        return of(id);
      }),
    );
  }

  /**
   * Guarda los cambios de un borrador: datos generales, preguntas y opciones.
   * Lo que se quita del formulario se da de baja de forma lógica.
   */
  guardarEdicion(original: Encuesta, payload: CrearEncuestaPayload): Observable<unknown> {
    const preguntasUrl = `${environment.apiUrl}/questions`;
    const pasos: Observable<unknown>[] = [
      this.http.put(`${this.apiUrl}/${original.id}`, {
        title: payload.titulo,
        description: payload.descripcion,
        closeDate: payload.fechaCierre ?? null,
      }),
    ];

    for (const pregunta of payload.preguntas) {
      const previa = original.preguntas.find((item) => item.id === pregunta.id);
      if (!previa) {
        pasos.push(this.http.post(`${this.apiUrl}/${original.id}/questions`, this.aPreguntaApi(pregunta)));
        continue;
      }

      const { options: _opciones, ...datos } = this.aPreguntaApi(pregunta);
      pasos.push(this.http.put(`${preguntasUrl}/${previa.id}`, datos));
      pasos.push(...this.pasosOpciones(previa, this.opcionesParaCrear(pregunta)));
    }

    const conservadas = payload.preguntas.map((pregunta) => pregunta.id);
    for (const previa of original.preguntas) {
      if (previa.estado === 'ACTIVA' && !conservadas.includes(previa.id)) {
        pasos.push(this.http.delete(`${preguntasUrl}/${previa.id}`));
      }
    }

    return concat(...pasos).pipe(toArray());
  }

  /** Lista todas las encuestas, incluidos borradores e inactivas (solo administrador). */
  listarEncuestas(): Observable<Encuesta[]> {
    return this.http
      .get<SurveyApi[]>(this.apiUrl, { params: { includeInactive: 'true' } })
      .pipe(map((encuestas) => encuestas.map((encuesta) => this.aEncuesta(encuesta))));
  }

  /** Lista las encuestas publicadas y vigentes que puede ver el estudiante. */
  listarEncuestasDisponibles(): Observable<EncuestaDisponible[]> {
    return this.http.get<SurveyApi[]>(this.apiUrl).pipe(
      map((encuestas) =>
        encuestas
          .filter((encuesta) => !encuesta.closeDate || new Date(encuesta.closeDate) > new Date())
          .map((encuesta) => this.aEncuestaDisponible(encuesta)),
      ),
    );
  }

  /** Trae el detalle completo (con preguntas) de una encuesta. */
  obtenerEncuestaPorId(id: string): Observable<Encuesta> {
    return this.http.get<SurveyApi>(`${this.apiUrl}/${id}`).pipe(map((encuesta) => this.aEncuesta(encuesta)));
  }

  /** Publica un borrador. */
  publicarEncuesta(id: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/publish`, {});
  }

  /** Cambia el estado de la encuesta a INACTIVA (baja lógica). */
  desactivarEncuesta(id: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /** Devuelve a borrador una encuesta publicada sin respuestas. */
  volverABorrador(id: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/draft`, {});
  }

  /** Reactiva una encuesta inactiva y la deja publicada. */
  reactivarEncuesta(id: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/activate`, {});
  }

  /** Envía las respuestas del usuario de la sesión. */
  enviarRespuestas(encuestaId: string, detalles: DetalleRespuesta[]): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${encuestaId}/responses`, {
      details: detalles.map((detalle) => ({
        questionId: Number(detalle.preguntaId),
        optionId: detalle.opcionId,
        responseText: detalle.texto,
      })),
    });
  }

  /** Estadísticas consolidadas de una encuesta. */
  obtenerEstadisticas(encuestaId: string, filtros?: { desde?: string; hasta?: string }): Observable<EstadisticasEncuesta> {
    let params = new HttpParams();
    if (filtros?.desde) params = params.set('from', new Date(`${filtros.desde}T00:00:00`).toISOString());
    if (filtros?.hasta) params = params.set('to', new Date(`${filtros.hasta}T23:59:59.999`).toISOString());

    return this.http.get<EstadisticasEncuesta>(`${this.apiUrl}/${encuestaId}/statistics`, { params });
  }

  /** Encuestas que respondió el usuario de la sesión. */
  listarMisRespuestas(): Observable<MiRespuesta[]> {
    return this.http.get<MyResponseApi[]>(`${environment.apiUrl}/users/me/responses`).pipe(
      map((envios) =>
        envios.map((envio) => {
          const porPregunta = new Map<number, { pregunta: string; respuesta: string }>();
          for (const detalle of envio.details) {
            const texto = detalle.optionText ?? detalle.responseText ?? '';
            const existente = porPregunta.get(detalle.questionId);
            if (existente) {
              existente.respuesta += `, ${texto}`;
            } else {
              porPregunta.set(detalle.questionId, { pregunta: detalle.questionText, respuesta: texto });
            }
          }
          return { id: envio.surveyResponseId, titulo: envio.surveyTitle, fecha: envio.submittedAt, detalles: [...porPregunta.values()] };
        }),
      ),
    );
  }

  /** Estudiantes que ya respondieron una encuesta específica. */
  listarEstudiantesQueRespondieron(encuestaId: string): Observable<EstudianteEncuestado[]> {
    return this.listarRespuestas(encuestaId).pipe(
      map((respuestas) =>
        respuestas.map((respuesta) => ({
          estudianteId: String(respuesta.userId),
          nombre: respuesta.userName,
          correo: respuesta.userEmail ?? '',
          fechaRespuesta: fechaLocal(respuesta.submittedAt),
        })),
      ),
    );
  }

  /** Respuestas de un estudiante puntual para una encuesta. */
  obtenerRespuestasEstudiante(encuestaId: string, estudianteId: string): Observable<RespuestasDeEstudiante> {
    return forkJoin([this.listarRespuestas(encuestaId), this.obtenerEncuestaPorId(encuestaId)]).pipe(
      map(([respuestas, encuesta]) => {
        const envio = respuestas.find((respuesta) => String(respuesta.userId) === estudianteId);
        if (!envio) return { nombre: '', correo: '', respuestas: [] };

        const fechaRespuesta = fechaLocal(envio.submittedAt);
        const porPregunta = new Map<number, RespuestaPregunta>();

        for (const detalle of envio.details) {
          const texto = detalle.optionText ?? detalle.responseText ?? '';
          const existente = porPregunta.get(detalle.questionId);
          if (existente) {
            existente.respuesta += `, ${texto}`;
            continue;
          }
          const pregunta = encuesta.preguntas.find((p) => p.id === String(detalle.questionId));
          porPregunta.set(detalle.questionId, {
            preguntaId: String(detalle.questionId),
            preguntaTexto: detalle.questionText ?? pregunta?.texto ?? '',
            tipoPregunta: pregunta?.tipo ?? 'ABIERTA',
            respuesta: texto,
            fechaRespuesta,
          });
        }

        return { nombre: envio.userName, correo: envio.userEmail ?? '', respuestas: [...porPregunta.values()] };
      }),
    );
  }

  private listarRespuestas(encuestaId: string): Observable<ResponseApi[]> {
    return this.http.get<ResponseApi[]>(`${this.apiUrl}/${encuestaId}/responses`);
  }

  /** La escala siempre es de 1 a 5; el backend necesita esas opciones para registrar las respuestas. */
  private opcionesParaCrear(pregunta: CrearEncuestaPayload['preguntas'][number]): string[] {
    if (pregunta.tipo === 'ESCALA') return OPCIONES_ESCALA;
    if (pregunta.tipo === 'SELECCION_MULTIPLE') return pregunta.opciones ?? [];
    return [];
  }

  private aPreguntaApi(pregunta: CrearEncuestaPayload['preguntas'][number]) {
    return {
      questionText: pregunta.texto,
      questionType: TIPOS_API[pregunta.tipo],
      isRequired: pregunta.requerida,
      displayOrder: pregunta.displayOrder,
      status: pregunta.estado === 'ACTIVA' ? 1 : 0,
      options: this.opcionesParaCrear(pregunta).map((texto) => ({ optionText: texto })),
    };
  }

  /** Compara las opciones activas con las del formulario, en el mismo orden. */
  private pasosOpciones(previa: Pregunta, deseadas: string[]): Observable<unknown>[] {
    const opcionesUrl = `${environment.apiUrl}/options`;
    const activas = (previa.opciones ?? []).filter((opcion) => opcion.estado === 'ACTIVA');
    const pasos: Observable<unknown>[] = [];

    deseadas.forEach((texto, indice) => {
      const actual = activas[indice];
      if (!actual) {
        pasos.push(this.http.post(`${environment.apiUrl}/questions/${previa.id}/options`, { optionText: texto }));
      } else if (actual.texto !== texto) {
        pasos.push(this.http.put(`${opcionesUrl}/${actual.id}`, { optionText: texto }));
      }
    });

    activas.slice(deseadas.length).forEach((opcion) => pasos.push(this.http.delete(`${opcionesUrl}/${opcion.id}`)));
    return pasos;
  }

  private aEncuesta(api: SurveyApi): Encuesta {
    return {
      id: String(api.surveyId),
      titulo: api.title,
      descripcion: api.description,
      estado: ESTADOS_API[api.status],
      fechaCreacion: fechaLocal(api.createdAt),
      fechaCierre: api.closeDate ?? undefined,
      totalRespuestas: api.responseCount ?? 0,
      respondida: api.answered ?? false,
      totalPreguntas: api.questionCount ?? api.questions?.length ?? 0,
      preguntas: (api.questions ?? []).map((pregunta) => this.aPregunta(pregunta)),
    };
  }

  private aPregunta(api: QuestionApi): Pregunta {
    const tipo = (Object.keys(TIPOS_API) as TipoPregunta[]).find((clave) => TIPOS_API[clave] === api.questionType);
    return {
      id: String(api.questionId),
      texto: api.questionText,
      tipo: tipo ?? 'ABIERTA',
      opciones: (api.options ?? []).map((opcion) => ({
        id: opcion.optionId,
        texto: opcion.optionText,
        estado: opcion.status === 1 ? 'ACTIVA' : 'INACTIVA',
      })),
      requerida: api.isRequired,
      displayOrder: api.displayOrder,
      estado: api.status === 1 ? 'ACTIVA' : 'INACTIVA',
    };
  }

  private aEncuestaDisponible(api: SurveyApi): EncuestaDisponible {
    const completada = api.answered ?? false;
    let fechaTexto = 'Sin fecha límite';
    if (completada) {
      fechaTexto = 'Ya respondida';
    } else if (api.closeDate) {
      const fecha = new Date(api.closeDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
      fechaTexto = `Disponible hasta: ${fecha}`;
    }

    return {
      id: String(api.surveyId),
      titulo: api.title,
      subtitulo: 'Encuesta académica',
      iconoSubtitulo: 'assignment',
      estado: completada ? 'COMPLETADO' : 'DISPONIBLE',
      descripcion: api.description ?? '',
      totalPreguntas: api.questionCount ?? 0,
      fechaTexto,
      completada,
    };
  }
}
