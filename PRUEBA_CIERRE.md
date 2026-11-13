# Verificación de cierre automático — 13/11/2026

Resultado real en Railway, con los dos microservicios desplegados y MySQL:

- Órdenes commit `ed46869`; Agenda commit `011aa0f`.
- Orden AAA123: `837d7d90-a9a9-4cab-b680-77df4dfddc36`, pasó de REPARADA a CERRADA.
- Cita de entrega del 27/11/2026 a las 12:30 de Colombia: `dd6e9e3d-105f-4ceb-ad83-a78842f70fb7`.
- La cita pasó a CANCELADA con actor `sistema-cierre` y motivo `Cancelación automática por cierre de orden`.
- La franja pasó de 1 disponible de 2 a 2 disponibles de 2.
- El historial de la orden registra el cierre, actor, fecha y motivo.
- El buzón de esa cita conserva exactamente un evento AGENDADA; no se creó CANCELADA_MANUAL ni otro evento de cancelación. Esto verifica la ausencia de aviso nuevo por cierre; no supone retractar el WhatsApp de agendamiento enviado previamente.
- Comprobación final: 2026-11-13 15:54:56 UTC.

También se verificaron 22 pruebas Java en Órdenes y 32 en Agenda, y una prueba HTTP local con dos procesos y bases independientes para cierre, liberación de cupo, confirmación del buzón y nueva reserva tras reapertura. Los procesos locales de prueba se detuvieron al finalizar.

Para revisar en el frontend: actualizar Órdenes, abrir AAA123, desplegar el historial; luego actualizar Agenda y consultar la cita del 27/11 a las 12:30. No es necesario esperar a la fecha de la cita ni cancelarla manualmente.
