export type TipoPregunta = 'ESCALA' | 'ABIERTA' | 'SELECCION_MULTIPLE';
export type EstadoPregunta = 'ACTIVA' | 'INACTIVA';

export const TIPOS_PREGUNTA: { value: TipoPregunta; label: string }[] = [
  { value: 'ESCALA', label: 'Escala (1 - 5)' },
  { value: 'ABIERTA', label: 'Respuesta abierta' },
  { value: 'SELECCION_MULTIPLE', label: 'Selección múltiple' },
];

export interface OpcionPregunta {
  id: number;
  texto: string;
  estado: EstadoPregunta;
}

export interface Pregunta {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  /** Vacío si tipo === 'ABIERTA' */
  opciones?: OpcionPregunta[];
  requerida: boolean;
  displayOrder: number;
  estado: EstadoPregunta;
}
