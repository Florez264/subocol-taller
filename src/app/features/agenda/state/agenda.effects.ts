import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable, catchError, exhaustMap, map, mergeMap, of, switchMap, takeUntil } from 'rxjs';
import { cerrarSesion } from '../../../core/auth/session.actions';
import { mensajeError } from '../../../core/http/api-error';
import { EnumRutas } from '../../../core/config/EnumRutas';
import { AgendaApi } from '../data-access/agenda.api';
import { agendaActions as a, agendaFeature } from './agenda.state';
@Injectable()
export class AgendaEffects {
  private readonly actions = inject(Actions);
  private readonly api = inject(AgendaApi);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly filtro = this.store.selectSignal(agendaFeature.selectFiltro);
  private readonly filtroFranjas = this.store.selectSignal(agendaFeature.selectFiltroFranjas);
  private readonly filtroNotificaciones = this.store.selectSignal(
    agendaFeature.selectFiltroNotificaciones,
  );
  readonly cargar = createEffect(() =>
    this.actions.pipe(
      ofType(a.cargar),
      switchMap(({ filtro }) =>
        this.api.listar(filtro).pipe(
          map((pagina) => a.cargarExito({ pagina })),
          catchError((e) => of(a.cargarError({ mensaje: mensajeError(e) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        ),
      ),
    ),
  );
  readonly franjas = createEffect(() =>
    this.actions.pipe(
      ofType(a.franjasCargar),
      switchMap(({ filtro }) =>
        this.api.franjas(filtro).pipe(
          map((pagina) => a.franjasExito({ pagina })),
          catchError((e) => of(a.franjasError({ mensaje: mensajeError(e) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        ),
      ),
    ),
  );
  readonly notificaciones = createEffect(() =>
    this.actions.pipe(
      ofType(a.notificacionesCargar),
      switchMap(({ filtro }) =>
        this.api.notificaciones(filtro).pipe(
          map((pagina) => a.notificacionesExito({ pagina })),
          catchError((e) => of(a.notificacionesError({ mensaje: mensajeError(e) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        ),
      ),
    ),
  );
  readonly consultar = createEffect(() =>
    this.actions.pipe(
      ofType(a.consultar),
      switchMap(({ id }) =>
        this.api.consultar(id).pipe(
          map((cita) => a.consultarExito({ cita })),
          catchError((e) => of(a.consultarError({ mensaje: mensajeError(e) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        ),
      ),
    ),
  );
  readonly operar = createEffect(() =>
    this.actions.pipe(
      ofType(a.crearFranja, a.agendar, a.cancelar, a.reintentar),
      exhaustMap((action) => {
        let request: Observable<{ id: string; message: string }>;
        if (action.type === a.crearFranja.type)
          request = this.api.crearFranja(action.inicio, action.cupo);
        else if (action.type === a.agendar.type) request = this.api.agendar(action.request);
        else if (action.type === a.cancelar.type)
          request = this.api.cancelar(action.id, action.motivo);
        else request = this.api.reintentar(action.id);
        return request.pipe(
          mergeMap((result) => {
            const success = a.operacionExito({ mensaje: result.message });
            if (action.type === a.crearFranja.type)
              return [success, a.franjasCargar({ filtro: this.filtroFranjas() })];
            if (action.type === a.reintentar.type)
              return [success, a.notificacionesCargar({ filtro: this.filtroNotificaciones() })];
            if (action.type === a.agendar.type) {
              void this.router.navigate(['/', EnumRutas.Agenda]);
              return [success];
            }
            return [success, a.cargar({ filtro: this.filtro() }), a.consultar({ id: result.id })];
          }),
          catchError((e) => of(a.operacionError({ mensaje: mensajeError(e) }))),
          takeUntil(this.actions.pipe(ofType(cerrarSesion))),
        );
      }),
    ),
  );
}
