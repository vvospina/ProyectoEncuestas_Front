export type EstadoEncuestaDashboard = 'BORRADOR' | 'ACTIVA' | 'INACTIVA';

export interface EncuestaDashboard {
  survey_id: number | string;
  title: string;
  created_at: string;
  close_date: string;
  status: EstadoEncuestaDashboard;
}