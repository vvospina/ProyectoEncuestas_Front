export type EstadoEncuestaAdmin = 'BORRADOR' | 'PUBLICADA' | 'INACTIVA';

export const ESTADOS_ENCUESTA_ADMIN: { value: EstadoEncuestaAdmin; label: string }[] = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'PUBLICADA', label: 'Publicada' },
  { value: 'INACTIVA', label: 'Inactiva' },
];