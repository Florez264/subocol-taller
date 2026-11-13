# Subocol Frontend

Angular 21 standalone, NgRx Store/Effects 21, Tailwind CSS 4 y TypeScript estricto. Repositorio independiente: esta carpeta frontend se puede publicar sin los proyectos Java. Node compatible: 20.19+, 22.12+ o 24.x dentro de las versiones soportadas por Angular 21. Se eligio Angular 21 por compatibilidad con Node 22.16 instalado; no se cambio Node global.

## Ejecutar

Desde esta carpeta instalar con `npm ci` cuando exista package-lock.json. Para generar el lock inicial o cambiar dependencias usar `npm install`. Se encontro un fallo interno de npm 10 durante la primera instalacion; alternativa sin cambiar npm global: `npx --yes npm@11 install`.

- `npm start`: http://localhost:4200 contra Ordenes localhost:8081 y Agenda localhost:8082.
- `npm run start:cloud`: http://localhost:4200 contra los dos backends ya desplegados en Railway.
- `npm run build`: compilacion de produccion con URLs Railway y reemplazo de environment.ts por environment.prod.ts.
- `npm run build:local`: compilacion con URLs locales.
- `npm run test:ci`: pruebas sin modo watch.

Ingresar con API_USER y API_PASSWORD configurados en ambos backends. No hay usuarios/secretos incrustados ni endpoint ficticio de login: se verifica el acceso con un listado de Ordenes y luego se utiliza Basic Auth para las API autorizadas. Las credenciales se conservan solo en memoria; una recarga requiere ingresar otra vez. No se guardan en Store, localStorage, sessionStorage ni environments. Usar HTTPS en nube. INTERNAL_PASSWORD y el token de WhatsApp pertenecen SOLO al backend.

## Estructura

- `src/environments`: environment.ts local y environment.prod.ts produccion, con contrato tipado. Estos archivos son publicos al compilar; nunca poner secretos.
- `src/app/core/config/EnumRutas.ts`: rutas de navegacion, endpoints y funciones para rutas con identificadores. Reutilizadas por Router y clientes HTTP.
- `src/app/core/auth`: sesion en memoria y guard de acceso.
- `src/app/core/http`: interceptor restringido al origen de las API y manejo de errores.
- `src/app/features/ordenes` y `agenda`: modelos, cliente API, actions/reducer/selectores/effects, facade y pagina standalone.
- `src/app/layout`: navegacion y cierre de sesion.
- `src/app/shared`: espacio para elementos reutilizados; no colocar logica de dominio aqui.

Los componentes se generaron con `ng g c nombre-del-componente`, agregando `--type=component --change-detection=OnPush --skip-tests`. Ejemplo: `npx ng g c features/ordenes/components/detalle-orden --type=component --change-detection=OnPush`.

## Control de peticiones

Las paginas hablan con una facade y NgRx Effects ejecuta HTTP. switchMap cancela busquedas/listados anteriores; catchError dentro de cada solicitud permite reintentar sin terminar el effect; cerrar sesion cancela solicitudes pendientes y borra los datos del Store. Paginacion real de 10 registros por peticion. Sin polling ni refresco automatico, para evitar trafico innecesario a Railway. No se usa cache persistente para no mezclar informacion de usuarios; al entrar a una pantalla se consulta informacion actual.

Para futuras escrituras, decidir exhaustMap para evitar doble envio o concatMap para operaciones ordenadas: no copiar switchMap a mutaciones, porque cancelar una peticion HTTP no garantiza cancelar una operacion ya recibida en el servidor.

## Operaciones disponibles

Desde Angular se puede crear una orden (cliente, vehiculo, aseguradora opcional), abrir su detalle e historial paginado, avanzar estados con motivo y version y reabrir una orden cerrada. Agenda permite crear franjas de 30 minutos, consultar cupos por asesor/rango, seleccionar orden y franja para agendar ingreso o entrega, consultar el detalle de cita y cancelar manualmente con motivo y confirmacion. Notificaciones permite filtrar por cita/estado, actualizar su estado y reintentar solo fallidas.

Las escrituras se ejecutan en NgRx Effects con exhaustMap para impedir doble envio mientras una solicitud esta pendiente; no se reintentan automaticamente. Las lecturas usan switchMap para cancelar resultados anteriores. La base de datos sigue siendo la autoridad para capacidad, transiciones y versiones concurrentes. Los formularios validan campos y los horarios se interpretan en America/Bogota (UTC-5), no en la zona del PC. Las paginas se cargan de forma lazy y no hay polling del navegador.

La cancelacion automatica de citas al cerrar una orden sigue pendiente en Java. La interfaz lo indica antes de confirmar el cierre y no intenta simularla con llamadas de cancelacion manual, que enviarian avisos. ACEPTADA significa aceptada por Meta, no entrega confirmada; SIMULADA corresponde al modo LOG.

Ver [PRUEBAS_MANUALES.md](PRUEBAS_MANUALES.md) para recorrer la aplicacion.

Los backends permiten localhost:4200 por CORS. Para alojar Angular, agregar su origen real a CORS_ALLOWED_ORIGINS de AMBOS backends; cambiar el environment no habilita CORS en Java. El hosting debe redirigir rutas desconocidas a index.html para soportar las rutas de Angular. No se ha creado/pushado repositorio Git ni desplegado este frontend.

## Verificacion inicial

12 de noviembre de 2026: compilacion de produccion correcta (312.87 kB iniciales, transferencia estimada 88.52 kB), URLs Railway verificadas en bundle y sin URLs locales. Siete pruebas HTTP/NgRx aprobadas. Pantalla de acceso revisada en Chrome a 1440 px y viewport movil de 390 px, sin desbordamiento horizontal. No se hicieron llamadas autenticadas a Railway ni envios reales de WhatsApp en esta verificacion.

## Verificacion del flujo operativo

13 de noviembre de 2026: compilacion de produccion correcta, 324.06 kB iniciales (transferencia estimada 89.18 kB) y 17 pruebas aprobadas. Recorrido en Chrome con API interceptada: acceso, crear orden, detalle, crear franja, agendar, consultar/cancelar cita, consultar/reintentar notificacion, transiciones hasta cierre y reapertura con historial. El navegador no hizo llamadas reales a Railway ni envio mensajes WhatsApp. La verificacion con credenciales reales corresponde al recorrido manual. No se modificaron ni desplegaron los backends en esta etapa.

La cache de Angular CLI se desactivo en angular.json para evitar ocupar el disco durante desarrollo. Se conservo la configuracion del candidato en environment.ts, que actualmente apunta a Railway. Para volver a backends locales configurar las URLs localhost en ese archivo; start:cloud utiliza environment.prod.ts.

## Mejoras de interfaz y validación (13/11/2026)

Los filtros de franjas y de disponibilidad al agendar se aplican automáticamente con 400 ms de espera y agrupación de cambios. NgRx conserva la cancelación de consultas anteriores. Los rangos inválidos no consultan; la paginación se reinicia al cambiar filtros. Actualizar permite repetir voluntariamente una consulta. Las franjas completas muestran Sin cupos.

El encabezado permite alternar claro/oscuro; se recuerda únicamente la preferencia visual en localStorage, nunca credenciales. Se respeta inicialmente la preferencia del sistema. El menú se puede desplegar en móvil y las tablas conservan desplazamiento horizontal dentro de su contenedor.

Validación real en Railway: 29 solicitudes verificaron autenticación, ciclo de estados, motivo obligatorio, rechazo de transición inválida, conflicto de versión, cierre, reapertura e historial de siete entradas. Orden de prueba QA1311: 94eae1de-0aad-4f00-b57f-bc8c556f236a; quedó reabierta en diagnóstico. La reserva original se conservó. La cancelación automática al cerrar sigue pendiente y no se considera validada.

Validación adicional con Chrome y API simulada: recorrido funcional completo, agrupación de filtros (dos cambios, una consulta), alternancia de tema y menú móvil a 390 px sin desbordamiento de la página de franjas. Las capturas y el guion de esta sesión se guardaron en TEMP, sin credenciales.


## Cierre automático disponible y probado en Railway

La advertencia de cierre se actualizó: las citas se cancelan en Agenda tras sincronizar el evento de cierre, sin crear aviso de cancelación por WhatsApp. El intervalo por defecto es de 15 segundos, con reintentos si el otro servicio está caído. Esta actualización sustituye las menciones anteriores al cierre como pendiente.

Prueba real completada sobre AAA123: orden CERRADA, cita del 27/11/2026 a las 12:30 CANCELADA por sistema-cierre, franja con 2 cupos de 2 y ningún evento de cancelación añadido al buzón. Evidencia en `../subocol-infra/PRUEBA_CIERRE.md`.


## Despliegue en Vercel

Importar el repositorio independiente del frontend en Vercel. Framework Angular, directorio raíz del repositorio, comando `npm run build`, salida `dist/subocol-frontend/browser`. El archivo `vercel.json` fija la salida y la reescritura de rutas de Angular a index.html. Producción toma las URLs públicas de Railway de environment.prod.ts. No hay secretos ni credenciales que configurar en Vercel para esta versión.

Una vez asignado el dominio estable HTTPS, agregar su origen exacto a CORS_ALLOWED_ORIGINS en AMBOS servicios de Railway, conservando localhost si se necesita desarrollo. Ejemplo ilustrativo: `http://localhost:4200,https://nombre-real.vercel.app`. Usar el dominio real, sin barra final ni rutas; los dominios temporales de preview no quedan autorizados automáticamente.

Revisar ingreso, consulta de órdenes y agenda y recarga directa de /agenda/franjas. El despliegue de Vercel no agrega un contenedor en Railway; las llamadas del frontend siguen usando los recursos de los backends. El plan Hobby está limitado por Vercel a usos personales no comerciales; revisar el plan aplicable si la demostración pasa a operación comercial.
