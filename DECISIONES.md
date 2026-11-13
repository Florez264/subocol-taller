# Decisiones de arquitectura — Subocol

## Alcance y fronteras

Se implementan dos microservicios Java 21 con Spring Boot y un frontend Angular 21 con NgRx y Tailwind. La entrega funcional incluye órdenes, ciclo de estados, historial, citas de ingreso/entrega, capacidad por asesor, notificaciones y cierre automático. El frontend está en Vercel y las APIs y MySQL en Railway. Docker Compose permite ejecutar una instalación local independiente de esos proveedores.

| Contexto | Datos y reglas que posee                                                                                                        | Datos externos que conserva                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Órdenes  | OrdenServicio; cliente, vehículo y aseguradora como valores; transiciones; motivos; autor y fecha; historial y buzón de cierres | No consulta tablas de Agenda                             |
| Agenda   | Franjas y cupos por asesor; citas y cancelaciones; versión de orden observada; control de cierres; buzón de notificaciones      | ordenId y resumen mínimo consultado por HTTP             |
| Angular  | Formularios, rutas, estado transitorio de presentación y coordinación de peticiones                                             | DTO de las APIs; no decide reglas definitivas de negocio |

Cada backend tiene repositorio, imagen, esquema MySQL y usuarios de aplicación/migración propios. Compartir una instancia física MySQL reduce consumo de la demostración; no se comparten tablas, entidades ni claves foráneas entre contextos. Separar físicamente las bases no cambia el contrato del dominio. No se crearon microservicios de cliente o vehículo porque en este alcance esos datos describen la orden y no tienen un ciclo autónomo.

## Comunicación y consistencia

Angular consume REST `/api/**` de ambos servicios mediante HTTPS en nube. Agenda consulta a Órdenes por HTTP interno (estado, versión y teléfono), y obtiene y confirma eventos de cierre. Se usa una cuenta técnica con rol SERVICIO; el asesor no puede operar los endpoints internos. No hay transacciones distribuidas.

La consulta remota ocurre antes de bloquear una franja. Cada reserva guarda la versión observada. Agenda serializa por orden el procesamiento del cierre y las reservas, y bloquea franjas para contar capacidad dentro de READ_COMMITTED. Un evento de cierre cancela solo reservas anteriores a su versión; no invalida reservas creadas tras una reapertura. La preparación de la fila de control se confirma antes de la transacción de reserva, evitando transacciones anidadas que agoten el pool reducido.

Órdenes guarda estado, historial y evento de cierre en una sola transacción. Agenda consulta hasta 20 pendientes cada 15 segundos y confirma después del commit local. Un fallo conserva el evento y provoca reintento; repetirlo es idempotente. La orden puede verse CERRADA unos segundos antes de que converjan las citas. No se promete cancelación instantánea durante una caída. La reapertura exige motivo y no reactiva citas ya canceladas.

## Auditoría y concurrencia

El historial anexa el estado inicial y las transiciones con actor autenticado, fecha UTC y secuencia. La versión optimista impide confirmar dos cambios sobre la misma versión; el cliente debe consultar otra vez ante 409. Si falla el historial o el evento de cierre, se revierte el cambio de estado.

El historial no tiene APIs de modificación, sus entidades son @Immutable y los usuarios de aplicación no tienen DELETE ni DDL. MySQL rechaza UPDATE/DELETE mediante triggers; las cuentas de migración son distintas. Esto no impide que un administrador con DDL quite los triggers. Los datos anteriores a la auditoría se marcan como estado observado sin inventar el autor original.

La capacidad se valida bajo bloqueo PESSIMISTIC_WRITE de la franja, no mediante una comprobación aislada en Angular. Reservar consume cupo y cancelar lo libera. No se usan locks locales de JVM porque no coordinan varias instancias.

## Notificaciones

Agenda escribe la cita y el aviso en un mismo commit. Un trabajador envía después, fuera de la transacción de cupos, con reintentos acotados y una reserva temporal con token. Los adaptadores LOG y WHATSAPP implementan el mismo puerto. Compose usa LOG por defecto y no necesita credenciales de Meta.

Agendar y cancelar manualmente generan avisos; el cierre automático cancela con actor `sistema-cierre` sin crear un aviso de cancelación. Los mensajes de agendamiento anteriores no se retractan. La entrega al proveedor es al menos una vez: una aceptación remota con respuesta perdida puede producir duplicados. ACEPTADA significa aceptación por Meta, no confirmación de entrega o lectura. No se implementó webhook de estados. La demostración usa hello_world/en_US; las plantillas específicas en español están pendientes de configuración/aprobación y no bloquean el modo LOG permitido en el PDF.

## Patrones y ubicación

| Enfoque                            | Ubicación                                                  | Justificación                                                                                |
| ---------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Puertos y adaptadores              | application/port e infrastructure                          | Separar dominio de HTTP, JPA y Meta; probar reglas sin red                                   |
| Repository                         | OrdenRepository y adaptadores de persistencia              | Persistir agregados mediante contratos propios                                               |
| Unidad de trabajo                  | UnidadTrabajoPort y TransactionTemplate en infraestructura | Atomicidad de orden, historial y evento                                                      |
| Máquina de estados                 | EstadoOrden y OrdenServicio                                | Transiciones explícitas sin clases State innecesarias                                        |
| Factory methods y valores          | OrdenServicio, Cita, Franja, DTO records                   | Construcción válida y valores inmutables                                                     |
| Outbox transaccional               | cierre_orden y notificacion_cita                           | No perder trabajo al fallar la red después del commit                                        |
| Anticorrupción del contrato remoto | OrdenesPort y OrdenesHttpAdapter                           | No importar el modelo Java ni la base del otro contexto                                      |
| NgRx Effects                       | features de Angular                                        | switchMap en lecturas, exhaustMap en escrituras, errores controlados y cancelación de sesión |

Lombok evita código repetitivo; se descartó @Data en entidades para no introducir setters o igualdad/toString accidental. Las consultas operativas usan JPA/JPQL; DDL y backfill viven en Flyway.

## Alternativas descartadas y compromisos

- **Base compartida por tablas:** acopla permisos, modelos y despliegues. Se comparten recursos físicos, no propiedad de datos.
- **Kafka, RabbitMQ, Gateway y Eureka:** agregan operación y consumo sin necesidad demostrada en dos servicios. Se eligió polling interno persistente, aceptando latencia de sincronización.
- **Redis/caché de cupos o estados:** puede basar decisiones en datos obsoletos. Las consultas son paginadas y los cupos se deciden en la base.
- **WhatsApp dentro de la transacción:** una caída de Meta prolongaría bloqueos o impediría reservar. Se usa outbox y trabajador.
- **Tercer servicio de notificaciones:** añade otro despliegue y otro problema de entrega fiable para un solo consumidor. Puede extraerse si aparecen otros dominios consumidores.
- **Autenticación completa OIDC/SSO:** fuera del tiempo disponible. Se usa Basic Auth sobre HTTPS, cuentas configurables y BCrypt en el backend. El navegador conserva credenciales solo en memoria; no hay administración de usuarios ni autorización por propietario de cada orden.
- **CORS con asterisco:** se permiten orígenes explícitos. El perfil cloud incorpora el dominio estable de Vercel; no se autorizan automáticamente previews ni rutas internas.

## Dos propuestas de IA rechazadas por el candidato

Estas decisiones proceden de la conversación real; no se atribuyen al candidato rechazos que no expresó.

1. **Generar automáticamente la inicialización de los dos proyectos Java.** El candidato pidió crear únicamente las carpetas y generar personalmente los proyectos en Spring Initializr. Se respetó la inicialización manual y después se trabajó sobre esos proyectos. Motivo: conservar control sobre la creación y configuración inicial de los servicios.
2. **Organizar la entrega como un único repositorio con configuración común en la raíz.** El candidato indicó que no iba a subir todo en un solo repositorio y pidió reorganizarlo por repositorios separados. Se separaron Órdenes, Agenda, frontend y los archivos de integración; cada backend conserva su configuración y Dockerfile. Motivo: poder versionar, construir y desplegar cada componente de manera independiente, manteniendo Compose como punto de integración local. La separación de repositorios es una elección del candidato, no una condición obligatoria de toda arquitectura de microservicios.

## Priorización y trabajo fuera de alcance

El PDF permite priorizar y justificar. Se completó el recorrido operativo y su cancelación automática; quedaron fuera la recepción externa de grandes aseguradoras, plantillas finales en español, webhook de entrega de WhatsApp, gestión completa de identidades, observabilidad avanzada, prueba de carga y endurecimiento de producción. No se inventan códigos de grandes aseguradoras; la política de registro manual usa INTEGRATED_INSURERS.

Franjas de 30 minutos y capacidad de 1 a 10 son supuestos explícitos del MVP, no límites impuestos por el PDF. Son puntos para validar con el evaluador. El consumo cloud se limita con dos servicios, una instancia MySQL, pools pequeños y heap acotado; no se promete una duración específica del saldo.

## Documentos relacionados

- [Contexto y comunicación](CONTEXTO.md)
- [Ejecución y repositorios](README.md)
- [Evidencia de verificación](VERIFICACION.md)
- [Prueba real de cierre automático](PRUEBA_CIERRE.md)
