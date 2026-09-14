export type EstadoEncuesta = 'DISPONIBLE' | 'PENDIENTE' | 'COMPLETADO';

export interface EncuestaDisponible {
  id: string;
  titulo: string;
  subtitulo: string;
  iconoSubtitulo: string;
  estado: EstadoEncuesta;
  descripcion: string;
  totalPreguntas: number;
  fechaTexto: string;
  completada: boolean;
}
