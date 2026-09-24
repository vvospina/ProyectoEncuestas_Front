import { TipoPregunta } from './pregunta.model';

export interface RespuestaPregunta {
  preguntaId: string;
  preguntaTexto: string;
  tipoPregunta: TipoPregunta;
  /**
   * Para ESCALA: '1' a '5'.
   * Para SELECCION_MULTIPLE: el texto de la opción elegida.
   * Para ABIERTA: el texto libre que escribió el estudiante.
   */
  respuesta: string;
  /** Formato ISO 'YYYY-MM-DD'. Permite filtrar si el back guarda varios envíos. */
  fechaRespuesta: string;
}