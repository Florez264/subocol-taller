import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EnumApiRutas, rutasOrden } from '../../../core/config/EnumRutas';
import { ApiResponse, Pagina } from '../../../core/models/api-response';
import { Orden, FiltroOrdenes, CrearOrden, CambioEstado, EstadoOrden } from '../models/orden';
@Injectable({ providedIn: 'root' })
export class OrdenesApi {
  private readonly http = inject(HttpClient);
  listar(filtro: FiltroOrdenes) {
    let params = new HttpParams().set('page', filtro.page).set('size', 10);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.placa.trim()) params = params.set('placa', filtro.placa.trim());
    return this.http
      .get<ApiResponse<Pagina<Orden>>>(environment.apiOrdenes + EnumApiRutas.OrdenesListar, {
        params,
      })
      .pipe(map((response) => response.data));
  }

  crear(request: CrearOrden) {
    return this.http
      .post<ApiResponse<{ id: string; message: string }>>(
        environment.apiOrdenes + EnumApiRutas.OrdenesCrear,
        request,
      )
      .pipe(map((r) => r.data));
  }
  consultar(id: string) {
    return this.http
      .get<ApiResponse<Orden>>(environment.apiOrdenes + rutasOrden.consultar(id))
      .pipe(map((r) => r.data));
  }
  historial(id: string, page: number) {
    return this.http
      .get<ApiResponse<Pagina<CambioEstado>>>(environment.apiOrdenes + rutasOrden.historial(id), {
        params: { page, size: 10 },
      })
      .pipe(map((r) => r.data));
  }
  cambiar(id: string, estado: EstadoOrden, motivo: string, version: number) {
    return this.http
      .patch<ApiResponse<{ id: string; message: string }>>(
        environment.apiOrdenes + rutasOrden.cambiarEstado(id),
        { estado, motivo, version },
      )
      .pipe(map((r) => r.data));
  }
  reabrir(id: string, motivo: string, version: number) {
    return this.http
      .patch<ApiResponse<{ id: string; message: string }>>(
        environment.apiOrdenes + rutasOrden.reabrir(id),
        { motivo, version },
      )
      .pipe(map((r) => r.data));
  }
}
