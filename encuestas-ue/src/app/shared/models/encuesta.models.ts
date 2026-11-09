import { Pregunta } from './pregunta.model';
import { EstadoEncuestaAdmin } from './estado-encuesta-admin.model';

export interface Encuesta {
  id: string;
  titulo: string;
  descripcion?: string;
  estado?: EstadoEncuestaAdmin;
  fechaCreacion?: string;
  fechaCierre?: string;
  totalPreguntas?: number;
  totalRespuestas?: number;
  respondida?: boolean;
  preguntas: Pregunta[];
}
