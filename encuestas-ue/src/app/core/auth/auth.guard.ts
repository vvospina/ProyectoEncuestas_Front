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
export const authGuard: CanActivateFn = async () => {
  if (!environment.production && environment.bypassAuthForDev) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.authReadyPromise; // sigue sirviendo para el caso de recargar la página

  if (auth.tieneSesionActiva()) { // antes: auth.currentUser()
    return true;
  }

  router.navigate(['/login']);
  return false;
};

// Se tiene que crear "adminGuard" cuando Node.js exponga el rol del usuario, para bloquear /admin/* a quien no sea ADMIN (F01).
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.authReadyPromise;

  // Obtenemos el usuario actual del servicio de autenticación
  const usuario = auth.currentUser(); // Asegúrate de que tu AuthService exponga el usuario actual

  // Si tiene sesión activa y su rol es ADMIN (roleId: 1), lo dejamos pasar
  const esAdmin = Number(usuario?.roleId ?? usuario?.role_id) === 1 || auth.userRole() === 'ADMIN';
  if (auth.tieneSesionActiva() && esAdmin) {
    return true;
  }

  // Si no es admin, lo mandamos al panel de usuario o al login
  router.navigate(['/login']);
  return false;
};
