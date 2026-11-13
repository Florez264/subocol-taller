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
import { Orden, FiltroOrdenes, CrearOrden, EstadoOrden, CambioEstado } from '../models/orden';
export const ordenesActions = createActionGroup({
  source: 'Ordenes',
  events: {
    Cargar: props<{ filtro: FiltroOrdenes }>(),
    'Cargar exito': props<{ pagina: Pagina<Orden> }>(),
    'Cargar error': props<{ mensaje: string }>(),
    'Detalle cargar': props<{ id: string; page: number }>(),
    'Detalle exito': props<{ orden: Orden; historial: Pagina<CambioEstado> }>(),
    'Detalle error': props<{ mensaje: string }>(),
    Crear: props<{ request: CrearOrden }>(),
    Cambiar: props<{ id: string; estado: EstadoOrden; motivo: string; version: number }>(),
    Reabrir: props<{ id: string; motivo: string; version: number }>(),
    'Operacion exito': props<{ mensaje: string }>(),
    'Operacion error': props<{ mensaje: string }>(),
    'Limpiar operacion': emptyProps(),
  },
});
interface State {
  pagina: Pagina<Orden> | null;
  cargando: boolean;
  error: string | null;
  orden: Orden | null;
  historial: Pagina<CambioEstado> | null;
  detalleCargando: boolean;
  detalleError: string | null;
  operando: boolean;
  operacionError: string | null;
  mensaje: string | null;
}
const initialState: State = {
  pagina: null,
  cargando: false,
  error: null,
  orden: null,
  historial: null,
  detalleCargando: false,
  detalleError: null,
  operando: false,
  operacionError: null,
  mensaje: null,
};
export const ordenesFeature = createFeature({
  name: 'ordenes',
  reducer: createReducer(
    initialState,
    on(ordenesActions.cargar, (s) => ({ ...s, cargando: true, error: null })),
    on(ordenesActions.cargarExito, (s, { pagina }) => ({
      ...s,
      pagina,
      cargando: false,
      error: null,
    })),
    on(ordenesActions.cargarError, (s, { mensaje }) => ({ ...s, cargando: false, error: mensaje })),
    on(ordenesActions.detalleCargar, (s, { id }) => ({
      ...s,
      detalleCargando: true,
      detalleError: null,
      orden: s.orden?.id === id ? s.orden : null,
      historial: null,
    })),
    on(ordenesActions.detalleExito, (s, { orden, historial }) => ({
      ...s,
      orden,
      historial,
      detalleCargando: false,
    })),
    on(ordenesActions.detalleError, (s, { mensaje }) => ({
      ...s,
      detalleCargando: false,
      detalleError: mensaje,
    })),
    on(ordenesActions.crear, ordenesActions.cambiar, ordenesActions.reabrir, (s) => ({
      ...s,
      operando: true,
      operacionError: null,
      mensaje: null,
    })),
    on(ordenesActions.operacionExito, (s, { mensaje }) => ({ ...s, operando: false, mensaje })),
    on(ordenesActions.operacionError, (s, { mensaje }) => ({
      ...s,
      operando: false,
      operacionError: mensaje,
    })),
    on(ordenesActions.limpiarOperacion, (s) => ({ ...s, mensaje: null, operacionError: null })),
    on(cerrarSesion, () => initialState),
  ),
});
export const selectOrdenesVm = createSelector(ordenesFeature.selectOrdenesState, (s) => s);
