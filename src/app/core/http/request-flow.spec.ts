import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { EnumApiRutas } from '../config/EnumRutas';
import { cerrarSesion } from '../auth/session.actions';
import { basicAuthorization, SessionService } from '../auth/session.service';
import { authInterceptor } from './auth.interceptor';
import {
  ordenesActions,
  ordenesFeature,
  selectOrdenesVm,
} from '../../features/ordenes/state/ordenes.state';
import { OrdenesEffects } from '../../features/ordenes/state/ordenes.effects';
import { agendaActions, agendaFeature } from '../../features/agenda/state/agenda.state';
import { AgendaEffects } from '../../features/agenda/state/agenda.effects';
const pagina = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};
const filtro = { page: 0, placa: '', estado: '' as const };
describe('Flujo HTTP, sesión y NgRx', () => {
  let http: HttpTestingController;
  let store: Store;
  let session: SessionService;
  const navegar = vi.fn().mockResolvedValue(true);
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideStore({
          [ordenesFeature.name]: ordenesFeature.reducer,
          [agendaFeature.name]: agendaFeature.reducer,
        }),
        provideEffects(OrdenesEffects, AgendaEffects),
        { provide: Router, useValue: { navigate: navegar } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
    session = TestBed.inject(SessionService);
    navegar.mockClear();
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  function ingresar() {
    session.iniciar('asesor', 'clave-solo-prueba').subscribe();
    const request = http.expectOne((r) => r.url.endsWith(EnumApiRutas.OrdenesListar));
    expect(request.request.headers.get('Authorization')).toBe(
      basicAuthorization('asesor', 'clave-solo-prueba'),
    );
    request.flush({ status: 200, data: pagina });
  }
  it('valida el acceso antes de abrir la sesión y la limpia al salir', () => {
    expect(session.autenticada).toBe(false);
    ingresar();
    expect(session.autenticada).toBe(true);
    expect(session.usuario()).toBe('asesor');
    session.limpiar();
    expect(session.header).toBeNull();
    expect(session.usuario()).toBe('');
  });
  it('no abre sesión con credenciales rechazadas', () => {
    session.iniciar('asesor', 'incorrecta').subscribe({ error: () => {} });
    http
      .expectOne((r) => r.url.endsWith(EnumApiRutas.OrdenesListar))
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.autenticada).toBe(false);
    expect(session.header).toBeNull();
  });
  it('solo envia Authorization a las API configuradas, nunca a terceros ni salud', () => {
    ingresar();
    const client = TestBed.inject(HttpClient);
    for (const url of [
      'https://externo.example/api/ordenes/listar',
      environment.apiOrdenes + '/actuator/health',
    ]) {
      client.get(url).subscribe();
      const req = http.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
    client.get(environment.apiAgenda + EnumApiRutas.CitasListar).subscribe();
    const own = http.expectOne(environment.apiAgenda + EnumApiRutas.CitasListar);
    expect(own.request.headers.get('Authorization')).toBe(session.header);
    own.flush({});
  });
  it('cancela una búsqueda anterior cuando cambia la página y conserva solo el resultado reciente', () => {
    store.dispatch(ordenesActions.cargar({ filtro }));
    const anterior = http.expectOne((r) => r.params.get('page') === '0');
    store.dispatch(ordenesActions.cargar({ filtro: { ...filtro, page: 1 } }));
    expect(anterior.cancelled).toBe(true);
    http
      .expectOne((r) => r.params.get('page') === '1')
      .flush({ status: 200, data: { ...pagina, page: 1 } });
    const vm = store.selectSignal(selectOrdenesVm);
    expect(vm().pagina?.page).toBe(1);
    expect(vm().cargando).toBe(false);
  });
  it('permite reintentar después de un error sin terminar el effect', () => {
    store.dispatch(ordenesActions.cargar({ filtro }));
    http
      .expectOne((r) => r.url.endsWith(EnumApiRutas.OrdenesListar))
      .flush({}, { status: 503, statusText: 'Unavailable' });
    const vm = store.selectSignal(selectOrdenesVm);
    expect(vm().error).toContain('no está disponible');
    store.dispatch(ordenesActions.cargar({ filtro }));
    http
      .expectOne((r) => r.url.endsWith(EnumApiRutas.OrdenesListar))
      .flush({ status: 200, data: pagina });
    expect(vm().error).toBeNull();
    expect(vm().pagina).toEqual(pagina);
  });
  it('cancela las dos API y vacia los datos al cerrar la sesión', () => {
    store.dispatch(ordenesActions.cargar({ filtro }));
    const ordenes = http.expectOne((r) => r.url.endsWith(EnumApiRutas.OrdenesListar));
    store.dispatch(agendaActions.cargar({ filtro: { page: 0, estado: '' } }));
    const agenda = http.expectOne((r) => r.url.endsWith(EnumApiRutas.CitasListar));
    store.dispatch(cerrarSesion());
    expect(ordenes.cancelled).toBe(true);
    expect(agenda.cancelled).toBe(true);
    const vm = store.selectSignal(selectOrdenesVm);
    expect(vm().pagina).toBeNull();
    expect(vm().cargando).toBe(false);
  });
  it('limpia sesión y redirige a acceso si la API rechaza credenciales después del ingreso', () => {
    ingresar();
    TestBed.inject(HttpClient)
      .get(environment.apiAgenda + EnumApiRutas.CitasListar)
      .subscribe({ error: () => {} });
    http
      .expectOne((r) => r.url.endsWith(EnumApiRutas.CitasListar))
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.autenticada).toBe(false);
    expect(navegar).toHaveBeenCalled();
  });
});
