import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { EnumRutas } from '../../../../core/config/EnumRutas';
import {
  aUtcColombia,
  rangoSemana,
  rangoValido,
  siguienteFranja,
} from '../../../../core/config/fechas';
import { agendaActions, selectAgendaVm } from '../../state/agenda.state';
import { SessionService } from '../../../../core/auth/session.service';
@Component({
  selector: 'app-franjas-page',
  imports: [DatePipe, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './franjas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FranjasPageComponent implements OnInit {
  private readonly store = inject(Store);
  readonly vm = this.store.selectSignal(selectAgendaVm);
  readonly rutas = EnumRutas;
  readonly session = inject(SessionService);
  readonly error = signal('');
  readonly errorRango = signal('');
  readonly rango = rangoSemana();
  asesor = '';
  page = 0;
  readonly form = inject(FormBuilder).nonNullable.group({
    inicio: [siguienteFranja(), Validators.required],
    cupo: [
      2,
      [Validators.required, Validators.min(1), Validators.max(10), Validators.pattern(/^[0-9]+$/)],
    ],
  });
  private readonly cambiosFiltro = new Subject<string>();
  filtrosCambiaron(): void {
    this.cambiosFiltro.next(
      JSON.stringify([this.rango.desde, this.rango.hasta, this.asesor.trim()]),
    );
  }
  constructor() {
    this.cambiosFiltro
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.cargar());
  }
  ngOnInit() {
    this.store.dispatch(agendaActions.limpiarOperacion());
    this.cargar();
  }
  cargar(page = 0) {
    if (!rangoValido(this.rango.desde, this.rango.hasta)) {
      this.errorRango.set('Elige un rango mayor a cero y de hasta 31 días.');
      return;
    }
    this.errorRango.set('');
    this.page = page;
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
  crear() {
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid || this.vm().operando) return;
    try {
      const { inicio, cupo } = this.form.getRawValue();
      const utc = aUtcColombia(inicio);
      const timestamp = Date.parse(utc);
      if (timestamp <= Date.now() || timestamp % 1800000 !== 0) {
        this.error.set('Elige una fecha futura que comience en minuto 00 o 30.');
        return;
      }
      this.store.dispatch(agendaActions.crearFranja({ inicio: utc, cupo }));
    } catch {
      this.error.set('Revisa la fecha de inicio.');
    }
  }
}
