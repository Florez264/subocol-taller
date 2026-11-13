import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AgendaFacade } from '../../state/agenda.facade';
import { agendaActions } from '../../state/agenda.state';
import { Cita } from '../../models/cita';
import { EnumRutas, rutaDetalleOrden } from '../../../../core/config/EnumRutas';
import { textoRequerido, UUID_PATTERN } from '../../../../shared/validaciones';
@Component({
  selector: 'app-agenda-page',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './agenda-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaPageComponent implements OnInit {
  readonly facade = inject(AgendaFacade);
  private readonly store = inject(Store);
  readonly rutas = EnumRutas;
  readonly detalleOrden = rutaDetalleOrden;
  readonly detalleAbierto = signal(false);
  readonly error = signal('');
  estado: 'RESERVADA' | 'CANCELADA' | '' = '';
  ordenId = '';
  asesor = '';
  page = 0;
  readonly cancelacion = inject(FormBuilder).nonNullable.group({
    motivo: ['', [textoRequerido, Validators.maxLength(500)]],
    confirmar: [false, Validators.requiredTrue],
  });
  ngOnInit() {
    this.cargar();
  }
  cargar(page = 0) {
    if (this.ordenId && !UUID_PATTERN.test(this.ordenId.trim())) {
      this.error.set('El identificador de orden debe ser un UUID válido.');
      return;
    }
    this.error.set('');
    this.page = page;
    this.facade.cargar({
      page,
      estado: this.estado,
      ordenId: this.ordenId.trim(),
      asesor: this.asesor.trim(),
    });
  }
  ver(id: string) {
    this.detalleAbierto.set(true);
    this.cancelacion.reset({ motivo: '', confirmar: false });
    this.store.dispatch(agendaActions.limpiarOperacion());
    this.store.dispatch(agendaActions.consultar({ id }));
  }
  puedeCancelar(cita: Cita) {
    return cita.estado === 'RESERVADA' && Date.parse(cita.inicio) > Date.now();
  }
  cancelar() {
    this.cancelacion.markAllAsTouched();
    const cita = this.facade.vm().cita;
    if (!cita || !this.puedeCancelar(cita) || this.cancelacion.invalid || this.facade.vm().operando)
      return;
    this.store.dispatch(
      agendaActions.cancelar({
        id: cita.id,
        motivo: this.cancelacion.controls.motivo.value.trim(),
      }),
    );
  }
}
