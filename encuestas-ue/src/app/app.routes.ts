import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppLayout } from './shared/layout/app-layout/app-layout';

export const routes: Routes = [
{
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },

  {
    path: 'session-closed',
    loadComponent: () =>
      import('./features/auth/session-closed/session-closed').then(
        (m) => m.SessionClosedComponent,
      ),
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },

  {
    path: 'admin',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/admin/admin.routes').then(
            (m) => m.ADMIN_ROUTES,
          ),
      },
    ],
  },

  {
    path: 'user',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/user/user.routes').then(
            (m) => m.USER_ROUTES,
          ),
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];
