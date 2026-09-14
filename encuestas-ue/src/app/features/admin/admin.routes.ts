import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'surveys/create',
    loadComponent: () =>
      import('./surveys/create/create-survey').then(
        (m) => m.CreateSurvey,
      ),
  },
  {
    path: 'surveys',
    loadComponent: () => import('./surveys/surveys').then((m) => m.Surveys),
  },
  {
    path: 'teachers',
    loadComponent: () => import('./teachers/teachers').then((m) => m.Teachers),
  },
  // Agregar aquí /admin/surveys/create, /admin/surveys/:id,
  // /admin/surveys/:id/results y /admin/teachers/:id/results (ver punto 24 del PDF).
];
