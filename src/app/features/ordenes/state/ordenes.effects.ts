import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  Observable,
  catchError,
  exhaustMap,
  forkJoin,
  map,
  mergeMap,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { cerrarSesion } from '../../../core/auth/session.actions';
import { mensajeError } from '../../../core/http/api-error';
import { rutaDetalleOrden } from '../../../core/config/EnumRutas';
import { OrdenesApi } from '../data-access/ordenes.api';
import { ordenesActions as a } from './ordenes.state';
@Injectable()
export class OrdenesEffects {
  private readonly actions = inject(Actions);
  private readonly api = inject(OrdenesApi);
  private readonly router = inject(Router);
  readonly cargar = createEffect(() =>
    this.actions.pipe(
      ofType(a.cargar),
      switchMap(({ filtro }) =>
        this.api.listar(filtro).pipe(
          map((pagina) => a.cargarExito({ pagina })),
          catchError((error) => of(a.cargarError({ mensaje: mensajeError(error) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        ),
      ),
    ),
  );
  readonly detalle = createEffect(() =>
    this.actions.pipe(
      ofType(a.detalleCargar),
      switchMap(({ id, page }) =>
        forkJoin({ orden: this.api.consultar(id), historial: this.api.historial(id, page) }).pipe(
          map((result) => a.detalleExito(result)),
          catchError((error) => of(a.detalleError({ mensaje: mensajeError(error) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        ),
      ),
    ),
  );
  readonly operar = createEffect(() =>
    this.actions.pipe(
      ofType(a.crear, a.cambiar, a.reabrir),
      exhaustMap((action) => {
        let request: Observable<{ id: string; message: string }>;
        if (action.type === a.crear.type) request = this.api.crear(action.request);
        else if (action.type === a.cambiar.type)
          request = this.api.cambiar(action.id, action.estado, action.motivo, action.version);
        else request = this.api.reabrir(action.id, action.motivo, action.version);
        return request.pipe(
          mergeMap((result) => {
            if (action.type === a.crear.type) {
              void this.router.navigate(rutaDetalleOrden(result.id));
              return [a.operacionExito({ mensaje: result.message })];
            }
            return [
              a.operacionExito({ mensaje: result.message }),
              a.detalleCargar({ id: result.id, page: 0 }),
            ];
          }),
          catchError((error) => of(a.operacionError({ mensaje: mensajeError(error) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        );
      }),
    ),
  );
}
