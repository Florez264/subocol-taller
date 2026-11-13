import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FiltroCitas } from '../models/cita';
import { agendaActions, selectAgendaVm } from './agenda.state';
@Injectable({ providedIn: 'root' })
export class AgendaFacade {
  private readonly store = inject(Store);
  readonly vm = this.store.selectSignal(selectAgendaVm);
  cargar(filtro: FiltroCitas): void {
    this.store.dispatch(agendaActions.cargar({ filtro }));
  }
}
