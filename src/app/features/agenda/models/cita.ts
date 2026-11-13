export interface Cita {
  id: string;
  ordenId: string;
  franjaId: string;
  asesor: string;
  inicio: string;
  fin: string;
  tipo: 'INGRESO' | 'ENTREGA';
  estado: 'RESERVADA' | 'CANCELADA';
  motivoCancelacion: string | null;
}
export interface FiltroCitas {
  page: number;
  estado: 'RESERVADA' | 'CANCELADA' | '';
  ordenId?: string;
  asesor?: string;
}

export interface Franja {
  id: string;
  asesor: string;
  inicio: string;
  fin: string;
  cupo: number;
  reservadas: number;
  disponibles: number;
}
export interface FiltroFranjas {
  page: number;
  asesor: string;
  desde: string;
  hasta: string;
}
export type EstadoNotificacion = 'PENDIENTE' | 'EN_PROCESO' | 'SIMULADA' | 'ACEPTADA' | 'FALLIDA';
export interface Notificacion {
  id: string;
  citaId: string;
  evento: 'AGENDADA' | 'CANCELADA_MANUAL';
  estado: EstadoNotificacion;
  intentos: number;
  creada: string;
  siguienteIntento: string | null;
  codigoError: string | null;
  mensajeProveedorId: string | null;
}
export interface FiltroNotificaciones {
  page: number;
  citaId: string;
  estado: EstadoNotificacion | '';
}
export interface AgendarCita {
  ordenId: string;
  franjaId: string;
  tipo: Cita['tipo'];
}
export interface CitaExtendida extends Cita {
  creadaPor: string;
  fechaCreacion: string;
  canceladaPor: string | null;
  fechaCancelacion: string | null;
}
