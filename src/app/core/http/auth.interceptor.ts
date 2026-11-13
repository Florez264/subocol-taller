import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../auth/session.service';
import { cerrarSesion } from '../auth/session.actions';
import { EnumRutas } from '../config/EnumRutas';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const store = inject(Store);
  const url = new URL(request.url, window.location.origin);
  const permitida = [environment.apiOrdenes, environment.apiAgenda].some((base) => {
    const configured = new URL(base);
    return url.origin === configured.origin && url.pathname.startsWith('/api/');
  });
  if (!permitida) return next(request);
  const authorization = session.header;
  const outgoing =
    authorization && !request.headers.has('Authorization')
      ? request.clone({ setHeaders: { Authorization: authorization } })
      : request;
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && session.autenticada) {
        session.limpiar();
        store.dispatch(cerrarSesion());
        void router.navigate(['/', EnumRutas.Acceso]);
      }
      return throwError(() => error);
    }),
  );
};
