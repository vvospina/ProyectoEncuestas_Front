export type TipoEncuesta = 'DOCENTE' | 'CURSO' | 'INSTITUCIONAL';

/** Lista para poblar el <select> del formulario. */
export const TIPOS_ENCUESTA: { value: TipoEncuesta; label: string }[] = [
  { value: 'DOCENTE', label: 'Evaluación docente' },
  { value: 'CURSO', label: 'Evaluación de curso' },
  { value: 'INSTITUCIONAL', label: 'Evaluación institucional' },
];