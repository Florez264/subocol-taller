import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnumRutas } from '../../../../core/config/EnumRutas';
import { textoRequerido } from '../../../../shared/validaciones';
import { ordenesActions, selectOrdenesVm } from '../../state/ordenes.state';
@Component({
  selector: 'app-nueva-orden',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './nueva-orden.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaOrdenComponent {
  private readonly store = inject(Store);
  readonly rutas = EnumRutas;
  readonly vm = this.store.selectSignal(selectOrdenesVm);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [textoRequerido, Validators.maxLength(150)]],
    documento: ['', [textoRequerido, Validators.maxLength(30)]],
    telefono: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    placa: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,10}$/)]],
    marca: ['', [textoRequerido, Validators.maxLength(60)]],
    modelo: ['', [textoRequerido, Validators.maxLength(60)]],
    descripcion: ['', [textoRequerido, Validators.maxLength(2000)]],
    asegurada: [false],
    codigoAseguradora: ['', Validators.maxLength(40)],
    nombreAseguradora: ['', Validators.maxLength(150)],
  });
  constructor() {
    this.store.dispatch(ordenesActions.limpiarOperacion());
    this.form.controls.asegurada.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((value) => {
        for (const [key, max] of [
          ['codigoAseguradora', 40],
          ['nombreAseguradora', 150],
        ] as const) {
          const control = this.form.controls[key];
          control.setValidators(
            value ? [textoRequerido, Validators.maxLength(max)] : [Validators.maxLength(max)],
          );
          control.updateValueAndValidity();
        }
      });
  }
  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.vm().operando) return;
    const v = this.form.getRawValue();
    this.store.dispatch(
      ordenesActions.crear({
        request: {
          cliente: {
            nombre: v.nombre.trim(),
            documento: v.documento.trim(),
            telefono: v.telefono.trim(),
          },
          vehiculo: {
            placa: v.placa.trim().toUpperCase(),
            marca: v.marca.trim(),
            modelo: v.modelo.trim(),
          },
          descripcion: v.descripcion.trim(),
          aseguradora: v.asegurada
            ? { codigo: v.codigoAseguradora.trim(), nombre: v.nombreAseguradora.trim() }
            : null,
        },
      }),
    );
  }
}
