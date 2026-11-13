import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';
import { EnumRutas } from '../config/EnumRutas';
export const sessionGuard: CanActivateFn = () =>
  inject(SessionService).autenticada || inject(Router).createUrlTree(['/', EnumRutas.Acceso]);
