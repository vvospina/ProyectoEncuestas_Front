import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'profile',
    loadComponent: () => import('../profile/view/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('../profile/edit/profile-edit').then((m) => m.ProfileEditComponent),
  },
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
    path: 'surveys/:id/edit',
    loadComponent: () =>
      import('./surveys/create/create-survey').then((m) => m.CreateSurvey),
  },
  {
    path: 'surveys/:id',
    data: { mode: 'view' },
    loadComponent: () =>
      import('./surveys/create/create-survey').then((m) => m.CreateSurvey),
  },
  {
    path: 'surveys/:id/results',
    loadComponent: () =>
      import('../admin/surveys/results/survey-results/survey-results').then((m) => m.SurveyResults),
  },
  {
    path: 'surveys/:id/results/:studentId',
    loadComponent: () =>
      import('../admin/surveys/results/student-answers/student-answers/student-answers').then(
        (m) => m.StudentAnswers,
      ),
  },
  {
    path: 'surveys',
    loadComponent: () => import('./surveys/surveys').then((m) => m.Surveys),
  },
];
