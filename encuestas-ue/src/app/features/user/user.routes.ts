import { Routes } from '@angular/router';
import { AvailableSurveysComponent } from './available-surveys/available-surveys';
import { SurveysComponent } from './surveys/surveys';

export const USER_ROUTES: Routes = [
  // Redirección por defecto al entrar a /user
  { path: '', pathMatch: 'full', redirectTo: 'available-surveys' },

  // Pantalla principal de encuestas disponibles (F06)
  {
    path: 'available-surveys',
    component: AvailableSurveysComponent,
  },

  // Diligenciar una encuesta específica (F07)
  {
    path: 'responder-encuesta/:id',
    component: SurveysComponent,
  },

  // Confirmación después de enviar respuestas (F08)
  {
    path: 'responder-encuesta/:id/completada',
    loadComponent: () =>
      import('./survey-success/survey-success').then((m) => m.SurveySuccess),
  },
];