export interface EstudianteEncuestado {
  estudianteId: string;
  nombre: string;
  correo: string;
  /** Formato ISO 'YYYY-MM-DD' */
  fechaRespuesta: string;
}