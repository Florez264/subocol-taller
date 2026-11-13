import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { ordenesFeature } from './features/ordenes/state/ordenes.state';
import { OrdenesEffects } from './features/ordenes/state/ordenes.effects';
import { agendaFeature } from './features/agenda/state/agenda.state';
import { AgendaEffects } from './features/agenda/state/agenda.effects';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      [ordenesFeature.name]: ordenesFeature.reducer,
      [agendaFeature.name]: agendaFeature.reducer,
    }),
    provideEffects(OrdenesEffects, AgendaEffects),
  ],
};
