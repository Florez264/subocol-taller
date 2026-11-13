# Verificación de la entrega — 13/11/2026

## Pruebas automatizadas

- Órdenes: 24 pruebas Java (reglas, ciclo, seguridad, contratos HTTP, concurrencia, rollback de auditoría/buzón y CORS cloud).
- Agenda: 34 pruebas Java (cupos, concurrencia, estados remotos, cancelación, outbox, reintentos, cierre, reapertura y CORS).
- Angular: 19 pruebas de autenticación, interceptor, NgRx, mutaciones, cancelación de sesión, fechas y filtros automáticos.

Los Dockerfile Java ejecutan `mvn verify` antes de producir el JAR. Las pruebas de aplicación Java usan H2/Flyway; no sustituyen los triggers de MySQL ni la prueba integrada de la base real.

## Evidencia funcional en nube

Se verificaron las APIs con Basic Auth real y el flujo operativo desde Angular. Agendar y cancelar manualmente produjeron WhatsApp recibidos por el candidato; las plantillas actuales son genéricas en inglés. El 13/11 se ejecutó el cierre de AAA123 en Railway: cita CANCELADA por sistema-cierre, cupo recuperado y sin evento de aviso de cancelación. Ver [detalle](PRUEBA_CIERRE.md).

Después del despliegue en Vercel se comprobaron en ambos servicios el preflight y la consulta autenticada con Origin https://subocol-taller.vercel.app: 200 y Access-Control-Allow-Origin exacto. Un dominio externo siguió respondiendo 403.

## Prueba HTTP local de los dos servicios

Se iniciaron los dos procesos Java con bases H2 independientes y el trabajador de cierres real. Se crearon orden y cita de entrega, se cerró la orden y se verificó cancelación, recuperación del cupo, confirmación del evento y ausencia de nuevo aviso de cancelación. Reabrir permitió una reserva nueva preservada ante el cierre anterior. El proveedor real de WhatsApp estuvo deshabilitado y los procesos se detuvieron al finalizar.

## Angular y contenedor

Se compila producción y el ambiente `production,docker`. Docker usa localhost:8081/8082 y Vercel mantiene Railway. La imagen final usa Nginx sin privilegios y resuelve las rutas SPA. Se verificaron previamente en Chrome el recorrido operativo con API simulada, el tema y el menú a 390 px, así como dos cambios de filtro agrupados en una sola consulta. Esas pruebas simuladas no se presentan como envíos a Meta.

## Validación conjunta mediante GitHub Actions

El workflow del repositorio frontend ejecuta sus pruebas, extrae el mismo ZIP de infraestructura que recibe el evaluador, clona ambos backends y ejecuta `docker compose up --build`. No usa credenciales cloud ni datos del candidato. La prueba HTTP comprueba salud, rutas de Nginx, autenticación real, versiones, reserva del último cupo, cierre automático con MySQL real, liberación y ausencia de evento de cancelación; LOG procesa el aviso de agendamiento. Al finalizar detiene el proyecto de prueba y conserva logs como artefacto.

Consultar el resultado concreto del workflow en la pestaña Actions del repositorio frontend. No se presenta una validación de sintaxis como equivalente a una ejecución completa. Docker Desktop del equipo del candidato no pudo iniciar WSL durante la preparación por falta de espacio local; por eso se usa además el runner aislado de GitHub para esta comprobación.

## Límites

No se hizo una prueba de carga, no se garantiza una duración del saldo de Railway ni inmutabilidad frente al administrador con DDL. La cancelación entre servicios es eventual. ACEPTADA por Meta no demuestra entrega/lectura; no hay webhook. La prueba Docker usa LOG y no envía WhatsApp real. Las credenciales de demostración cloud se comparten separadamente, nunca dentro del paquete público.
