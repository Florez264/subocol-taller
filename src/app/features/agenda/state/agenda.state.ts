import {
  createActionGroup,
  createFeature,
  createReducer,
  createSelector,
  emptyProps,
  on,
  props,
} from '@ngrx/store';
import { Pagina } from '../../../core/models/api-response';
import { cerrarSesion } from '../../../core/auth/session.actions';
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
export const agendaActions = createActionGroup({
  source: 'Agenda',
  events: {
    Cargar: props<{ filtro: FiltroCitas }>(),
    'Cargar exito': props<{ pagina: Pagina<Cita> }>(),
    'Cargar error': props<{ mensaje: string }>(),
    'Franjas cargar': props<{ filtro: FiltroFranjas }>(),
    'Franjas exito': props<{ pagina: Pagina<Franja> }>(),
    'Franjas error': props<{ mensaje: string }>(),
    'Notificaciones cargar': props<{ filtro: FiltroNotificaciones }>(),
    'Notificaciones exito': props<{ pagina: Pagina<Notificacion> }>(),
    'Notificaciones error': props<{ mensaje: string }>(),
    Consultar: props<{ id: string }>(),
    'Consultar exito': props<{ cita: CitaExtendida }>(),
    'Consultar error': props<{ mensaje: string }>(),
    'Crear franja': props<{ inicio: string; cupo: number }>(),
    Agendar: props<{ request: AgendarCita }>(),
    Cancelar: props<{ id: string; motivo: string }>(),
    Reintentar: props<{ id: string }>(),
    'Operacion exito': props<{ mensaje: string }>(),
    'Operacion error': props<{ mensaje: string }>(),
    'Limpiar operacion': emptyProps(),
  },
});
interface State {
  pagina: Pagina<Cita> | null;
  cargando: boolean;
  error: string | null;
  filtro: FiltroCitas;
  franjas: Pagina<Franja> | null;
  franjasCargando: boolean;
  franjasError: string | null;
  filtroFranjas: FiltroFranjas;
  notificaciones: Pagina<Notificacion> | null;
  notificacionesCargando: boolean;
  notificacionesError: string | null;
  filtroNotificaciones: FiltroNotificaciones;
  cita: CitaExtendida | null;
  citaCargando: boolean;
  citaError: string | null;
  operando: boolean;
  operacionError: string | null;
  mensaje: string | null;
}
const initialState: State = {
  pagina: null,
  cargando: false,
  error: null,
  filtro: { page: 0, estado: '' },
  franjas: null,
  franjasCargando: false,
  franjasError: null,
  filtroFranjas: { page: 0, asesor: '', desde: '', hasta: '' },
  notificaciones: null,
  notificacionesCargando: false,
  notificacionesError: null,
  filtroNotificaciones: { page: 0, citaId: '', estado: '' },
  cita: null,
  citaCargando: false,
  citaError: null,
  operando: false,
  operacionError: null,
  mensaje: null,
};
export const agendaFeature = createFeature({
  name: 'agenda',
  reducer: createReducer(
    initialState,
    on(agendaActions.cargar, (s, { filtro }) => ({ ...s, filtro, cargando: true, error: null })),
    on(agendaActions.cargarExito, (s, { pagina }) => ({ ...s, pagina, cargando: false })),
    on(agendaActions.cargarError, (s, { mensaje }) => ({ ...s, cargando: false, error: mensaje })),
    on(agendaActions.franjasCargar, (s, { filtro }) => ({
      ...s,
      filtroFranjas: filtro,
      franjasCargando: true,
      franjasError: null,
    })),
    on(agendaActions.franjasExito, (s, { pagina }) => ({
      ...s,
      franjas: pagina,
      franjasCargando: false,
    })),
    on(agendaActions.franjasError, (s, { mensaje }) => ({
      ...s,
      franjasCargando: false,
      franjasError: mensaje,
    })),
    on(agendaActions.notificacionesCargar, (s, { filtro }) => ({
      ...s,
      filtroNotificaciones: filtro,
      notificacionesCargando: true,
      notificacionesError: null,
    })),
    on(agendaActions.notificacionesExito, (s, { pagina }) => ({
      ...s,
      notificaciones: pagina,
      notificacionesCargando: false,
    })),
    on(agendaActions.notificacionesError, (s, { mensaje }) => ({
      ...s,
      notificacionesCargando: false,
      notificacionesError: mensaje,
    })),
    on(agendaActions.consultar, (s) => ({ ...s, cita: null, citaCargando: true, citaError: null })),
    on(agendaActions.consultarExito, (s, { cita }) => ({ ...s, cita, citaCargando: false })),
    on(agendaActions.consultarError, (s, { mensaje }) => ({
      ...s,
      citaCargando: false,
      citaError: mensaje,
    })),
    on(
      agendaActions.crearFranja,
      agendaActions.agendar,
      agendaActions.cancelar,
      agendaActions.reintentar,
      (s) => ({ ...s, operando: true, operacionError: null, mensaje: null }),
    ),
    on(agendaActions.operacionExito, (s, { mensaje }) => ({ ...s, operando: false, mensaje })),
    on(agendaActions.operacionError, (s, { mensaje }) => ({
      ...s,
      operando: false,
      operacionError: mensaje,
    })),
    on(agendaActions.limpiarOperacion, (s) => ({ ...s, operacionError: null, mensaje: null })),
    on(cerrarSesion, () => initialState),
  ),
});
export const selectAgendaVm = createSelector(agendaFeature.selectAgendaState, (s) => s);
