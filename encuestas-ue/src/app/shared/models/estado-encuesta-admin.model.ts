export type EstadoEncuestaAdmin = 'BORRADOR' | 'ACTIVA' | 'INACTIVA';

export const ESTADOS_ENCUESTA_ADMIN: { value: EstadoEncuestaAdmin; label: string }[] = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'INACTIVA', label: 'Inactiva' },
];