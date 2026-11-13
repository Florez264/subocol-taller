# Recorrido de prueba desde Angular

## Abrir la aplicacion

Desde frontend ejecutar `npm run start:cloud`, abrir http://localhost:4200 e ingresar con API_USER/API_PASSWORD de Railway. Si ya habia un servidor abierto, recargar; si no toma las rutas nuevas, detenerlo con Ctrl+C y volver a iniciarlo. Ambos backends deben permitir http://localhost:4200 en CORS_ALLOWED_ORIGINS. No usar claves MySQL ni INTERNAL_PASSWORD para el acceso.

## 1. Crear orden

En Ordenes de servicio pulsar + Nueva orden. Completar nombre, documento, telefono (7 a 15 digitos; + opcional), placa de 5 a 10 letras/numeros, marca, modelo y trabajo solicitado. Para aseguradora activar la casilla y completar codigo y nombre. Crear orden abre su detalle y el historial inicial. El servidor puede rechazar aseguradoras reservadas a integracion.

## 2. Crear cupo

Entrar en Franjas y cupos. Elegir fecha futura con minuto 00 o 30 y cupo entero entre 1 y 10. Se crea para el asesor autenticado y dura 30 minutos. Los horarios del formulario y la tabla se muestran en Colombia (UTC-5). Consultar un rango de hasta 31 dias para encontrarla.

## 3. Agendar ingreso

En Agenda de citas pulsar + Agendar cita. Buscar la orden por placa o seleccionar de las opciones; tambien se puede entrar desde Agendar cita para esta orden en el detalle. Seleccionar una franja con disponibilidad y tipo Ingreso. Confirmar cita vuelve al listado. El servidor vuelve a comprobar cupo y estado de orden. Repetir hasta llenar el cupo debe impedir nuevas reservas.

## 4. Avisos y cancelacion

En la cita pulsar Avisos. Actualizar tras alrededor de un minuto: PENDIENTE/EN_PROCESO son estados de trabajo; SIMULADA es LOG; ACEPTADA confirma recepcion por Meta, no entrega al telefono. Verificar el telefono para confirmar llegada. En WHATSAPP la plantilla configurada hello_world es un saludo generico, no texto personalizado de cita.

Para cancelar, volver a Agenda, pulsar Ver detalle, escribir un motivo y confirmar la casilla; pulsar Cancelar cita. Solo se permite antes de que comience la franja y estando RESERVADA. Debe aparecer CANCELADA y registrarse CANCELADA_MANUAL en avisos. Si el envio es FALLIDA, revisar codigo y variables de Meta en Railway (por ejemplo token vigente), corregir y pulsar Reintentar. El servidor decide si ese aviso aun es reintentable.

## 5. Reparacion y entrega

Abrir la orden pulsando su placa. Avanzar REGISTRADA -> EN_DIAGNOSTICO -> EN_REPARACION -> REPARADA, o pasar por PENDIENTE_AUTORIZACION desde diagnostico. Indicar motivo para cada cambio. El historial debe mostrar actor autenticado y fecha. La version se envia automaticamente; si otro asesor actualizo la orden, refrescarla antes de volver a intentar.

Con la orden REPARADA se puede agendar una cita de ENTREGA, repitiendo la seleccion de una franja futura con cupo. Cerrar la orden exige motivo y casilla de confirmacion. Tras cerrar, esperar la sincronizacion (intervalo por defecto 15 segundos) y actualizar Agenda: las reservas anteriores al cierre deben quedar CANCELADA con actor sistema-cierre, cupos recuperados y sin nuevo evento CANCELADA_MANUAL. Reabrir con motivo no reactiva las citas. Requiere desplegar primero Ordenes y luego Agenda con las migraciones de cierre.

## 6. Reabrir

En una orden CERRADA escribir motivo y pulsar Reabrir con motivo. Debe volver a EN_DIAGNOSTICO y conservar el historial. Revisar tambien filtros, paginacion, campos invalidos, fechas pasadas y cupos agotados.

Las pruebas reales crean registros y pueden enviar mensajes al numero configurado en WHATSAPP_TEST_RECIPIENT. No poner el token de Meta en el frontend. No repetir una creacion si se corto la conexion sin revisar antes si el servidor la guardo.
