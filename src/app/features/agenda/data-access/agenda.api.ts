import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EnumApiRutas,
  rutasCita,
  rutaReintentarNotificacion,
} from '../../../core/config/EnumRutas';
import { ApiResponse, Pagina } from '../../../core/models/api-response';
import {
  Cita,
  CitaExtendida,
  FiltroCitas,
  Franja,
  FiltroFranjas,
  Notificacion,
  FiltroNotificaciones,
  AgendarCita,
} from '../models/cita';
@Injectable({ providedIn: 'root' })
export class AgendaApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiAgenda;
  listar(filtro: FiltroCitas) {
    let params = new HttpParams().set('page', filtro.page).set('size', 10);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.ordenId) params = params.set('ordenId', filtro.ordenId);
    if (filtro.asesor) params = params.set('asesor', filtro.asesor);
    return this.http
      .get<ApiResponse<Pagina<Cita>>>(this.base + EnumApiRutas.CitasListar, { params })
      .pipe(map((r) => r.data));
  }
  franjas(filtro: FiltroFranjas) {
    let params = new HttpParams().set('page', filtro.page).set('size', 10);
    if (filtro.asesor) params = params.set('asesor', filtro.asesor);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    return this.http
      .get<ApiResponse<Pagina<Franja>>>(this.base + EnumApiRutas.FranjasListar, { params })
      .pipe(map((r) => r.data));
  }
  notificaciones(filtro: FiltroNotificaciones) {
    let params = new HttpParams().set('page', filtro.page).set('size', 10);
    if (filtro.citaId) params = params.set('citaId', filtro.citaId);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    return this.http
      .get<ApiResponse<Pagina<Notificacion>>>(this.base + EnumApiRutas.NotificacionesListar, {
        params,
      })
      .pipe(map((r) => r.data));
  }
  consultar(id: string) {
    return this.http
      .get<ApiResponse<CitaExtendida>>(this.base + rutasCita.consultar(id))
      .pipe(map((r) => r.data));
  }
  crearFranja(inicio: string, cupo: number) {
    return this.http
      .post<ApiResponse<{ id: string; message: string }>>(this.base + EnumApiRutas.FranjasCrear, {
        inicio,
        cupo,
      })
      .pipe(map((r) => r.data));
  }
  agendar(request: AgendarCita) {
    return this.http
      .post<ApiResponse<{ id: string; message: string }>>(
        this.base + EnumApiRutas.CitasAgendar,
        request,
      )
      .pipe(map((r) => r.data));
  }
  cancelar(id: string, motivo: string) {
    return this.http
      .patch<ApiResponse<{ id: string; message: string }>>(this.base + rutasCita.cancelar(id), {
        motivo,
      })
      .pipe(map((r) => r.data));
  }
  reintentar(id: string) {
    return this.http
      .patch<ApiResponse<{ id: string; message: string }>>(
        this.base + rutaReintentarNotificacion(id),
        null,
      )
      .pipe(map((r) => r.data));
  }
}
