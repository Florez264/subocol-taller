import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnumRutas } from '../../../../core/config/EnumRutas';
import { textoRequerido } from '../../../../shared/validaciones';
import { EstadoOrden, SIGUIENTES_ESTADOS } from '../../models/orden';
import { ordenesActions, selectOrdenesVm } from '../../state/ordenes.state';
@Component({
  selector: 'app-detalle-orden',
  imports: [DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './detalle-orden.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleOrdenComponent {
  private readonly store = inject(Store);
  readonly vm = this.store.selectSignal(selectOrdenesVm);
  readonly rutas = EnumRutas;
  private id = '';
  private versionCargada = '';
  readonly form = inject(FormBuilder).nonNullable.group({
    estado: [''],
    motivo: ['', [textoRequerido, Validators.maxLength(500)]],
    confirmarCierre: [false],
  });
  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((params) => {
        this.id = params.get('id') ?? '';
        this.cargar();
      });
    effect(() => {
      const orden = this.vm().orden;
      if (orden && `${orden.id}:${orden.version}` !== this.versionCargada) {
        this.versionCargada = `${orden.id}:${orden.version}`;
        this.form.reset({
          estado: SIGUIENTES_ESTADOS[orden.estado][0] ?? '',
          motivo: '',
          confirmarCierre: false,
        });
      }
    });
  }
  siguientes(estado: EstadoOrden) {
    return SIGUIENTES_ESTADOS[estado];
  }
  etiqueta(estado: string | null) {
    return estado ? estado.replaceAll('_', ' ') : 'REGISTRO INICIAL';
  }
  cargar(page = 0) {
    if (this.id) this.store.dispatch(ordenesActions.detalleCargar({ id: this.id, page }));
  }
  actualizar(reabrir = false) {
    this.form.markAllAsTouched();
    const o = this.vm().orden;
    const v = this.form.getRawValue();
    if (
      !o ||
      this.vm().operando ||
      this.vm().detalleCargando ||
      this.vm().detalleError ||
      this.form.controls.motivo.invalid
    )
      return;
    if (reabrir) {
      if (o.estado === 'CERRADA')
        this.store.dispatch(
          ordenesActions.reabrir({ id: o.id, motivo: v.motivo.trim(), version: o.version }),
        );
      return;
    }
    if (
      !SIGUIENTES_ESTADOS[o.estado].includes(v.estado as EstadoOrden) ||
      (v.estado === 'CERRADA' && !v.confirmarCierre)
    )
      return;
    this.store.dispatch(
      ordenesActions.cambiar({
        id: o.id,
        estado: v.estado as EstadoOrden,
        motivo: v.motivo.trim(),
        version: o.version,
      }),
    );
  }
}
