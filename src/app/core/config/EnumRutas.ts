export enum EnumRutas {
  Acceso = 'acceso',
  Ordenes = 'ordenes',
  Agenda = 'agenda',
  NuevaOrden = 'ordenes/nueva',
  DetalleOrden = 'ordenes/:id',
  Franjas = 'agenda/franjas',
  NuevaCita = 'agenda/nueva',
  Notificaciones = 'agenda/notificaciones',
}
export enum EnumApiRutas {
  OrdenesListar = '/api/ordenes/listar',
  CitasListar = '/api/citas/listar',
  OrdenesCrear = '/api/ordenes/crear',
  FranjasCrear = '/api/franjas/crear',
  FranjasListar = '/api/franjas/listar',
  CitasAgendar = '/api/citas/agendar',
  NotificacionesListar = '/api/notificaciones/listar',
}
export const rutasOrden = {
  consultar: (id: string) => `/api/ordenes/consultar/${encodeURIComponent(id)}`,
  cambiarEstado: (id: string) => `/api/ordenes/${encodeURIComponent(id)}/cambiar-estado`,
  reabrir: (id: string) => `/api/ordenes/${encodeURIComponent(id)}/reabrir`,
  historial: (id: string) => `/api/ordenes/${encodeURIComponent(id)}/historial`,
};
export const rutasCita = {
  consultar: (id: string) => `/api/citas/consultar/${encodeURIComponent(id)}`,
  cancelar: (id: string) => `/api/citas/${encodeURIComponent(id)}/cancelar`,
};

export const rutaDetalleOrden = (id: string) => ['/', EnumRutas.Ordenes, id];
export const rutaReintentarNotificacion = (id: string) =>
  `/api/notificaciones/${encodeURIComponent(id)}/reintentar`;
