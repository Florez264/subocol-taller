import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnumRutas } from '../../../../core/config/EnumRutas';
import { aUtcColombia, rangoSemana, rangoValido } from '../../../../core/config/fechas';
import { UUID_PATTERN } from '../../../../shared/validaciones';
import { agendaActions, selectAgendaVm } from '../../state/agenda.state';
import { ordenesActions, selectOrdenesVm } from '../../../ordenes/state/ordenes.state';
import { Cita } from '../../models/cita';
@Component({
  selector: 'app-nueva-cita',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './nueva-cita.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaCitaComponent implements OnInit {
  private readonly store = inject(Store);
  readonly vm = this.store.selectSignal(selectAgendaVm);
  readonly ordenes = this.store.selectSignal(selectOrdenesVm);
  readonly rutas = EnumRutas;
  readonly error = signal('');
  readonly rango = rangoSemana();
  placa = '';
  asesor = '';
  readonly form = inject(FormBuilder).nonNullable.group({
    ordenId: ['', [Validators.required, Validators.pattern(UUID_PATTERN)]],
    franjaId: ['', [Validators.required, Validators.pattern(UUID_PATTERN)]],
    tipo: ['INGRESO' as Cita['tipo'], Validators.required],
  });
  constructor() {
    const destroy = inject(DestroyRef);
    this.cambiosFiltro
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(destroy))
      .subscribe(() => this.buscarFranjas());
    this.form.controls.ordenId.valueChanges.pipe(takeUntilDestroyed(destroy)).subscribe((id) => {
      if (UUID_PATTERN.test(id)) this.store.dispatch(ordenesActions.detalleCargar({ id, page: 0 }));
    });
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed(destroy))
      .subscribe((params) => {
        const id = params.get('ordenId');
        if (id && UUID_PATTERN.test(id)) this.form.controls.ordenId.setValue(id);
      });
  }
  private readonly cambiosFiltro = new Subject<string>();
  filtrosCambiaron(): void {
    this.cambiosFiltro.next(
      JSON.stringify([this.rango.desde, this.rango.hasta, this.asesor.trim()]),
    );
  }
  ngOnInit() {
    this.store.dispatch(agendaActions.limpiarOperacion());
    this.buscarOrdenes();
    this.buscarFranjas();
  }
  buscarOrdenes(page = 0) {
    this.store.dispatch(ordenesActions.cargar({ filtro: { page, placa: this.placa, estado: '' } }));
  }
  buscarFranjas(page = 0) {
    this.error.set('');
    if (!rangoValido(this.rango.desde, this.rango.hasta)) {
      this.error.set('El rango debe ser mayor a cero y de hasta 31 días.');
      return;
    }
    this.form.controls.franjaId.reset('');
    this.store.dispatch(
      agendaActions.franjasCargar({
        filtro: {
          page,
          asesor: this.asesor.trim(),
          desde: aUtcColombia(this.rango.desde),
          hasta: aUtcColombia(this.rango.hasta),
        },
      }),
    );
  }
  ordenSeleccionada() {
    const o = this.ordenes().orden;
    return o?.id === this.form.controls.ordenId.value ? o : null;
  }
  agendar() {
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid || this.vm().operando) return;
    const orden = this.ordenSeleccionada();
    if (!orden || this.ordenes().detalleCargando || this.ordenes().detalleError) {
      this.error.set('Espera a que se consulte la orden seleccionada.');
      return;
    }
    if (orden.estado === 'CERRADA') {
      this.error.set('No se pueden agendar citas para una orden cerrada.');
      return;
    }
    if (this.form.controls.tipo.value === 'ENTREGA' && orden.estado !== 'REPARADA') {
      this.error.set('La cita de entrega requiere una orden reparada.');
      return;
    }
    const franja = this.vm().franjas?.content.find(
      (f) => f.id === this.form.controls.franjaId.value,
    );
    if (!franja || franja.disponibles < 1 || Date.parse(franja.inicio) <= Date.now()) {
      this.error.set('Selecciona una franja futura con cupo disponible.');
      return;
    }
    this.store.dispatch(agendaActions.agendar({ request: this.form.getRawValue() }));
  }
}
