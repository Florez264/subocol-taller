import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FiltroOrdenes } from '../models/orden';
import { ordenesActions, selectOrdenesVm } from './ordenes.state';
@Injectable({ providedIn: 'root' })
export class OrdenesFacade {
  private readonly store = inject(Store);
  readonly vm = this.store.selectSignal(selectOrdenesVm);
  cargar(filtro: FiltroOrdenes): void {
    this.store.dispatch(ordenesActions.cargar({ filtro }));
  }
}
