export interface EstudianteDashboard {
  id: number;
  name: string;
  email: string;
}

export interface DetalleRespuestaDashboard {
  questionId: number;
  questionText: string;
  answer: string;
}

export interface EncuestaRespondidaDashboard {
  surveyId: number;
  surveyTitle: string;
  submittedAt: string;
  details: DetalleRespuestaDashboard[];
}

export interface EncuestaPendienteDashboard {
  surveyId: number;
  title: string;
  closeDate?: string | null;
}

export interface DashboardEstudiante {
  student: EstudianteDashboard;
  answeredSurveys: EncuestaRespondidaDashboard[];
  pendingSurveys: EncuestaPendienteDashboard[];
}
