import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Un "guard" es un portero: se ejecuta ANTES de entrar a una ruta.
 * Si devuelve true, te deja pasar. Si devuelve false, te bloquea
 * (y aquí envia de vuelta al login, recordando a dónde querías ir).
 *
 * Esto solo protege la INTERFAZ (que no se vea la pantalla).
 * La seguridad real se valida también en Node.js con el middleware.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.authReadyPromise; // sigue sirviendo para el caso de recargar la página

  if (auth.tieneSesionActiva()) { // antes: auth.currentUser()
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/** Solo deja entrar a /admin a quienes el backend reconoce como administradores. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.authReadyPromise;

  // Sin sesión, authGuard ya se encarga de enviar al login
  if (!auth.tieneSesionActiva()) {
    return false;
  }

  if (auth.userRole() === 'ADMIN') {
    return true;
  }

  router.navigate(['/user/available-surveys']);
  return false;
};
