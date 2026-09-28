import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Un "interceptor" revisa TODAS las peticiones
 * que salen hacia el backend y les agrega el token REST almacenado antes
 * de que se vayan. Así ningún componente tiene que acordarse de
 * poner el header manualmente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return from(auth.getAccessToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }
      const requestConToken = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(requestConToken);
    }),
  );
};
