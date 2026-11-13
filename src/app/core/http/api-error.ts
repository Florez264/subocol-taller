import { HttpErrorResponse } from '@angular/common/http';
export function mensajeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Ocurrió un error. Intenta nuevamente.';
  if (error.status === 0)
    return 'No fue posible conectar. Revisa la conexión y los permisos CORS del servidor.';
  if (error.status === 401) return 'Usuario o contraseña incorrectos, o la sesión ya no es válida.';
  if (error.status === 403) return 'Tu usuario no tiene permiso para esta operación.';
  if (error.status >= 500)
    return 'El servicio no está disponible. Intenta nuevamente en unos momentos.';
  return typeof error.error?.data?.message === 'string'
    ? error.error.data.message
    : 'No fue posible completar la solicitud.';
}
