import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import {
  ordenesActions as o,
  ordenesFeature,
  selectOrdenesVm,
} from '../../features/ordenes/state/ordenes.state';
import { OrdenesEffects } from '../../features/ordenes/state/ordenes.effects';
import {
  agendaActions as a,
  agendaFeature,
  selectAgendaVm,
} from '../../features/agenda/state/agenda.state';
import { AgendaEffects } from '../../features/agenda/state/agenda.effects';
import { NuevaOrdenComponent } from '../../features/ordenes/pages/nueva-orden/nueva-orden.component';
import { aUtcColombia, rangoValido } from '../config/fechas';
import { cerrarSesion } from '../auth/session.actions';
const ordenId = '00000000-0000-4000-8000-000000000001';
const citaId = '00000000-0000-4000-8000-000000000002';
const franjaId = '00000000-0000-4000-8000-000000000003';
const pagina = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};
const orden = {
  cliente: { nombre: 'Ana', documento: '123', telefono: '+573001234567' },
  vehiculo: { placa: 'ABC123', marca: 'Toyota', modelo: 'Corolla' },
  descripcion: 'Revisar frenos',
  aseguradora: null,
};
describe('Operaciones del taller mediante NgRx', () => {
  let http: HttpTestingController;
  let store: Store;
  const navegar = vi.fn().mockResolvedValue(true);
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore({ ordenes: ordenesFeature.reducer, agenda: agendaFeature.reducer }),
        provideEffects(OrdenesEffects, AgendaEffects),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
    navegar.mockClear();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navegar);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  it('evita doble creación de orden mientras la primera solicitud está pendiente', () => {
    store.dispatch(o.crear({ request: orden }));
    store.dispatch(o.crear({ request: orden }));
    const req = http.expectOne((r) => r.url.endsWith('/api/ordenes/crear'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(orden);
    req.flush({ status: 201, data: { id: ordenId, message: 'Creada' } });
    expect(navegar).toHaveBeenCalledWith(['/', 'ordenes', ordenId]);
    expect(store.selectSignal(selectOrdenesVm)().operando).toBe(false);
  });
  it('no repite automáticamente una escritura con conflicto de versión y permite un intento explícito posterior', () => {
    store.dispatch(
      o.cambiar({ id: ordenId, estado: 'EN_REPARACION', motivo: 'Autorizado', version: 2 }),
    );
    const req = http.expectOne((r) => r.url.endsWith('/cambiar-estado'));
    expect(req.request.body.version).toBe(2);
    req.flush(
      { status: 409, data: { message: 'La orden cambió' } },
      { status: 409, statusText: 'Conflict' },
    );
    expect(store.selectSignal(selectOrdenesVm)().operacionError).toBe('La orden cambió');
    store.dispatch(
      o.cambiar({ id: ordenId, estado: 'EN_REPARACION', motivo: 'Autorizado', version: 3 }),
    );
    const retry = http.expectOne((r) => r.url.endsWith('/cambiar-estado'));
    expect(retry.request.body.version).toBe(3);
    retry.flush({}, { status: 409, statusText: 'Conflict' });
  });
  it('reabrir envía solo motivo y versión y después vuelve a consultar detalle e historial', () => {
    store.dispatch(o.reabrir({ id: ordenId, motivo: 'Nueva revisión', version: 5 }));
    const req = http.expectOne((r) => r.url.endsWith('/reabrir'));
    expect(req.request.body).toEqual({ motivo: 'Nueva revisión', version: 5 });
    req.flush({ status: 200, data: { id: ordenId, message: 'Reabierta' } });
    http
      .expectOne((r) => r.url.endsWith('/consultar/' + ordenId))
      .flush({
        status: 200,
        data: {
          ...orden,
          id: ordenId,
          estado: 'EN_DIAGNOSTICO',
          version: 6,
          fechaCreacion: '2030-01-01T00:00:00Z',
        },
      });
    http.expectOne((r) => r.url.endsWith('/historial')).flush({ status: 200, data: pagina });
    expect(store.selectSignal(selectOrdenesVm)().orden?.version).toBe(6);
  });
  it('crea la orden desde el formulario y exige datos de aseguradora solo si se activa', () => {
    const fixture = TestBed.createComponent(NuevaOrdenComponent);
    const component = fixture.componentInstance;
    component.form.patchValue({
      nombre: ' Ana ',
      documento: '123',
      telefono: '+573001234567',
      placa: 'abc123',
      marca: 'Toyota',
      modelo: 'Corolla',
      descripcion: 'Revisar frenos',
      asegurada: true,
    });
    component.guardar();
    http.expectNone((r) => r.method === 'POST');
    component.form.patchValue({ asegurada: false });
    component.guardar();
    const req = http.expectOne((r) => r.url.endsWith('/crear'));
    expect(req.request.body.cliente.nombre).toBe('Ana');
    expect(req.request.body.vehiculo.placa).toBe('ABC123');
    expect(req.request.body.aseguradora).toBeNull();
    req.flush({ status: 201, data: { id: ordenId, message: 'Creada' } });
  });
  it('no duplica un agendamiento con doble clic y mantiene los ids del servidor', () => {
    const request = { ordenId, franjaId, tipo: 'INGRESO' as const };
    store.dispatch(a.agendar({ request }));
    store.dispatch(a.agendar({ request }));
    const req = http.expectOne((r) => r.url.endsWith('/citas/agendar'));
    expect(req.request.body).toEqual(request);
    req.flush({ status: 201, data: { id: citaId, message: 'Agendada' } });
    expect(navegar).toHaveBeenCalledWith(['/', 'agenda']);
  });
  it('cancelación manual envía motivo y refresca cita y listado tras confirmación del servidor', () => {
    store.dispatch(a.cancelar({ id: citaId, motivo: 'Cliente no disponible' }));
    const req = http.expectOne((r) => r.url.endsWith('/' + citaId + '/cancelar'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ motivo: 'Cliente no disponible' });
    req.flush({ status: 200, data: { id: citaId, message: 'Cancelada' } });
    http.expectOne((r) => r.url.endsWith('/citas/listar')).flush({ status: 200, data: pagina });
    http
      .expectOne((r) => r.url.endsWith('/citas/consultar/' + citaId))
      .flush({ status: 200, data: { id: citaId, estado: 'CANCELADA' } });
    expect(store.selectSignal(selectAgendaVm)().cita?.estado).toBe('CANCELADA');
  });
  it('reintento de notificación es PATCH sin cuerpo y conserva el filtro al refrescar', () => {
    store.dispatch(a.notificacionesCargar({ filtro: { page: 1, citaId, estado: 'FALLIDA' } }));
    http
      .expectOne((r) => r.url.endsWith('/notificaciones/listar'))
      .flush({ status: 200, data: pagina });
    store.dispatch(a.reintentar({ id: ordenId }));
    const req = http.expectOne((r) => r.url.endsWith('/reintentar'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush({ status: 200, data: { id: ordenId, message: 'Pendiente' } });
    const refreshed = http.expectOne((r) => r.url.endsWith('/notificaciones/listar'));
    expect(refreshed.request.params.get('citaId')).toBe(citaId);
    expect(refreshed.request.params.get('page')).toBe('1');
    refreshed.flush({ status: 200, data: pagina });
  });
  it('cerrar sesión abandona la respuesta de una mutación pendiente sin llenar el Store de otra sesión', () => {
    store.dispatch(o.crear({ request: orden }));
    const req = http.expectOne((r) => r.method === 'POST');
    store.dispatch(cerrarSesion());
    expect(req.cancelled).toBe(true);
    expect(store.selectSignal(selectOrdenesVm)().mensaje).toBeNull();
    expect(navegar).not.toHaveBeenCalled();
  });
});
describe('Horarios del taller', () => {
  it('interpreta la entrada como Colombia, sin usar la zona horaria del navegador', () => {
    expect(aUtcColombia('2030-01-02T09:30')).toBe('2030-01-02T14:30:00.000Z');
  });
  it('rechaza rangos invertidos o superiores a 31 días', () => {
    expect(rangoValido('2030-01-02T09:00', '2030-01-01T09:00')).toBe(false);
    expect(rangoValido('2030-01-01T09:00', '2030-02-02T09:00')).toBe(false);
    expect(rangoValido('2030-01-01T09:00', '2030-01-08T09:00')).toBe(true);
  });
});
