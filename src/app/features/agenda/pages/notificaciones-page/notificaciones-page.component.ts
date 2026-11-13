import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnumRutas } from '../../../../core/config/EnumRutas';
import { UUID_PATTERN } from '../../../../shared/validaciones';
import { EstadoNotificacion } from '../../models/cita';
import { agendaActions, selectAgendaVm } from '../../state/agenda.state';
@Component({
  selector: 'app-notificaciones-page',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './notificaciones-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesPageComponent {
  private readonly store = inject(Store);
  readonly vm = this.store.selectSignal(selectAgendaVm);
  readonly rutas = EnumRutas;
  readonly estados: EstadoNotificacion[] = [
    'PENDIENTE',
    'EN_PROCESO',
    'SIMULADA',
    'ACEPTADA',
    'FALLIDA',
  ];
  readonly error = signal('');
  citaId = '';
  estado: EstadoNotificacion | '' = '';
  page = 0;
  constructor() {
    this.store.dispatch(agendaActions.limpiarOperacion());
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) => {
        this.citaId = p.get('citaId') ?? '';
        this.cargar();
      });
  }
  cargar(page = 0) {
    if (this.citaId && !UUID_PATTERN.test(this.citaId.trim())) {
      this.error.set('El identificador de cita debe ser un UUID válido.');
      return;
    }
    this.error.set('');
    this.page = page;
    this.store.dispatch(
      agendaActions.notificacionesCargar({
        filtro: { page, citaId: this.citaId.trim(), estado: this.estado },
      }),
    );
  }
  reintentar(id: string) {
    if (!this.vm().operando) this.store.dispatch(agendaActions.reintentar({ id }));
  }
}
