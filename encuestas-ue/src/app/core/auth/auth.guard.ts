import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environment/environment';

/**
 * Un "guard" es un portero: se ejecuta ANTES de entrar a una ruta.
 * Si devuelve true, te deja pasar. Si devuelve false, te bloquea
 * (y aquí envia de vuelta al login).
 *
 * Esto solo protege la INTERFAZ (que no se vea la pantalla).
 * La seguridad real debe validarse también en Node.js con el
 * middleware.
 */
export const authGuard: CanActivateFn = () => {

  // Bypass temporal para poder revisar pantallas mientras llegan las
  // credenciales reales de Firebase. Ver environment.development.ts
  if (!environment.production && environment.bypassAuthForDev) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};

// Se tiene que crear "adminGuard" cuando Node.js exponga el rol del usuario, para bloquear /admin/* a quien no sea ADMIN (F01).
