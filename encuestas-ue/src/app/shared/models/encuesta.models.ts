import { Item } from './item.model';
import { Pregunta } from './pregunta.model';
import { TipoEncuesta } from './tipo-encuesta.model';
import { EstadoEncuestaAdmin } from './estado-encuesta-admin.model';

export interface Encuesta {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoEncuesta;
  profesor: Item;
  estado?: EstadoEncuestaAdmin;
  fechaCreacion?: string;
  preguntas: Pregunta[];
}