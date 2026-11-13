import { Routes } from '@angular/router';
import { EnumRutas } from './core/config/EnumRutas';
import { sessionGuard } from './core/auth/session.guard';
export const routes: Routes = [
  {
    path: EnumRutas.Acceso,
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: '',
    canActivate: [sessionGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: EnumRutas.Ordenes },
      {
        path: EnumRutas.NuevaOrden,
        loadComponent: () =>
          import('./features/ordenes/pages/nueva-orden/nueva-orden.component').then(
            (m) => m.NuevaOrdenComponent,
          ),
      },
      {
        path: EnumRutas.DetalleOrden,
        loadComponent: () =>
          import('./features/ordenes/pages/detalle-orden/detalle-orden.component').then(
            (m) => m.DetalleOrdenComponent,
          ),
      },
      {
        path: EnumRutas.Franjas,
        loadComponent: () =>
          import('./features/agenda/pages/franjas-page/franjas-page.component').then(
            (m) => m.FranjasPageComponent,
          ),
      },
      {
        path: EnumRutas.NuevaCita,
        loadComponent: () =>
          import('./features/agenda/pages/nueva-cita/nueva-cita.component').then(
            (m) => m.NuevaCitaComponent,
          ),
      },
      {
        path: EnumRutas.Notificaciones,
        loadComponent: () =>
          import('./features/agenda/pages/notificaciones-page/notificaciones-page.component').then(
            (m) => m.NotificacionesPageComponent,
          ),
      },
      {
        path: EnumRutas.Ordenes,
        loadComponent: () =>
          import('./features/ordenes/pages/ordenes-page/ordenes-page.component').then(
            (m) => m.OrdenesPageComponent,
          ),
      },
      {
        path: EnumRutas.Agenda,
        loadComponent: () =>
          import('./features/agenda/pages/agenda-page/agenda-page.component').then(
            (m) => m.AgendaPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: EnumRutas.Ordenes },
];
