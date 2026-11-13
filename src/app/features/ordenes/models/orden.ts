export type EstadoOrden =
  | 'REGISTRADA'
  | 'EN_DIAGNOSTICO'
  | 'PENDIENTE_AUTORIZACION'
  | 'EN_REPARACION'
  | 'REPARADA'
  | 'CERRADA';
export interface Orden {
  id: string;
  cliente: { nombre: string; documento: string; telefono: string };
  vehiculo: { placa: string; marca: string; modelo: string };
  aseguradora: { codigo: string; nombre: string } | null;
  descripcion: string;
  estado: EstadoOrden;
  fechaCreacion: string;
  version: number;
}
export const ESTADOS_ORDEN: readonly EstadoOrden[] = [
  'REGISTRADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_AUTORIZACION',
  'EN_REPARACION',
  'REPARADA',
  'CERRADA',
];
export interface FiltroOrdenes {
  page: number;
  placa: string;
  estado: EstadoOrden | '';
}

export interface CrearOrden {
  cliente: Orden['cliente'];
  vehiculo: Orden['vehiculo'];
  aseguradora: Orden['aseguradora'];
  descripcion: string;
}
export interface CambioEstado {
  id: string;
  ordenId: string;
  anterior: EstadoOrden | null;
  nuevo: EstadoOrden;
  motivo: string;
  actor: string;
  fecha: string;
  secuencia: number;
}
export const SIGUIENTES_ESTADOS: Record<EstadoOrden, readonly EstadoOrden[]> = {
  REGISTRADA: ['EN_DIAGNOSTICO'],
  EN_DIAGNOSTICO: ['PENDIENTE_AUTORIZACION', 'EN_REPARACION'],
  PENDIENTE_AUTORIZACION: ['EN_REPARACION'],
  EN_REPARACION: ['REPARADA'],
  REPARADA: ['CERRADA'],
  CERRADA: [],
};
