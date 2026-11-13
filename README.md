# Subocol — frontend Angular

Aplicación Angular 21 standalone, NgRx 21 y Tailwind CSS 4 para operar órdenes, agenda y avisos del taller.

- [Demostración desplegada](https://subocol-taller.vercel.app/acceso)
- [Órdenes](https://github.com/Florez264/ordenes-service)
- [Agenda](https://github.com/Florez264/agenda-service)

## Ambientes y ejecución

```sh
npm ci
npm start
```

El candidato conserva en `environment.ts` su configuración de desarrollo, actualmente conectada a Railway. No se sobrescribe. `npm run start:cloud` usa el ambiente de producción.

| Archivo                                | Uso                     | APIs                                       |
| -------------------------------------- | ----------------------- | ------------------------------------------ |
| src/environments/environment.ts        | Desarrollo con ng serve | Configuración elegida por el desarrollador |
| src/environments/environment.prod.ts   | Producción/Vercel       | URLs públicas de Railway                   |
| src/environments/environment.docker.ts | Imagen Docker local     | localhost:8081 y localhost:8082            |

Estos archivos son públicos al compilar y no contienen secretos. Se valida el acceso con un listado de Órdenes y se envía Basic Auth únicamente a las APIs configuradas. Credenciales solo en memoria: recargar requiere ingresar de nuevo; no se guardan en Store ni almacenamiento persistente. El modo claro/oscuro guarda únicamente la preferencia visual.

## Docker Compose

La carpeta de integración `subocol-infra`, al lado de `frontend`, `ordenes-service` y `agenda-service`, contiene el punto de entrada:

```sh
cd ../subocol-infra
docker compose up
```

Abrir http://localhost:4200/acceso. Usuario local `asesor`, contraseña `asesor-local-password`. La imagen compila con `production,docker` y sirve estáticos mediante Nginx sin Node en ejecución. Las rutas directas de Angular se resuelven con index.html. No depende de Vercel ni Railway.

Para construir solo el frontend local: `npm run build:docker`. El despliegue Vercel usa `npm run build` y conserva environment.prod.ts. El paquete [entrega/subocol-infra.zip](entrega/subocol-infra.zip) contiene la integración, los scripts públicos y las instrucciones de clonación/extracción. Ver el [diagrama](CONTEXTO.md), las [decisiones](DECISIONES.md) y la [verificación](VERIFICACION.md) directamente en este repositorio. El ZIP no incluye .env.local ni secretos. No hace falta un cuarto repositorio.

## Funcionalidad

Crear órdenes, consultar detalle e historial expandible, avanzar estados con motivo/versión y reabrir. Crear franjas de 30 minutos, consultar disponibilidad, agendar ingreso/entrega, cancelar manualmente y consultar/reintentar avisos fallidos. El cierre de una orden cancela sus citas en Agenda mediante sincronización del backend, sin generar aviso de cancelación; puede tardar unos segundos. La reapertura no reactiva citas.

Filtros de franjas automáticos con 400 ms de espera, rangos de hasta 31 días y paginación real. Diseño adaptable, navegación móvil y tema claro/oscuro. Todos los horarios se interpretan en Colombia (UTC−5). ACEPTADA indica aceptación de Meta, no entrega confirmada; SIMULADA indica modo LOG.

## Organización y peticiones

- Rutas y endpoints centralizados en `core/config/EnumRutas.ts`.
- Autenticación en `core/auth`, interceptor y errores en `core/http`.
- Órdenes y Agenda en `features`, con modelos, clientes HTTP, NgRx y páginas lazy.
- Navegación en `layout`; validaciones reutilizables en `shared`.

Los componentes se generaron con `ng g c nombre-del-componente`, usando OnPush. Effects usa switchMap para lecturas y exhaustMap para escrituras; no reintenta automáticamente una mutación. Cerrar sesión cancela solicitudes pendientes y limpia el estado. No hay polling del navegador ni caché persistente. El servidor vuelve a validar capacidad y versiones.

## Verificación

```sh
npm run test:ci
npm run build
npm run build:docker
```

19 pruebas verifican autenticación, restricciones del interceptor, NgRx, mutaciones, versión obsoleta, cierre de sesión, agrupación de filtros y fechas de Colombia. Se verificó el recorrido en Chrome con API simulada y se realizaron comprobaciones reales en Railway; el cierre de AAA123 canceló la cita, recuperó cupos y no agregó aviso de cancelación. Ver [VERIFICACION.md](VERIFICACION.md) y `PRUEBAS_MANUALES.md` para distinguir cada evidencia.

## Vercel

Repositorio importado en Vercel con framework Angular, comando `npm run build`, salida `dist/subocol-frontend/browser` y reescritura SPA en vercel.json. No requiere variables secretas. Los perfiles cloud de ambos backends permiten el origen estable de Vercel; las URLs de preview no se autorizan automáticamente. Las cuentas y tokens de Meta pertenecen únicamente a Agenda.

## Verificación continua y paquete de integración

El workflow de GitHub Actions prueba Angular y levanta MySQL, las dos APIs y el frontend usando exactamente el Compose del ZIP entregado. La prueba HTTP recorre hasta el cierre automático con MySQL real, verifica rutas SPA y procesa avisos en modo LOG sin credenciales de nube. Consultar Actions para su resultado y logs.

Si se actualiza la carpeta hermana subocol-infra, regenerar la entrega con `python tools/preparar-entrega.py`. El evaluador solo necesita extraer el ZIP y ejecutar Docker Compose; no necesita Python para construir ni operar la aplicación.
