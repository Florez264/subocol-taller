import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionService } from '../../../../core/auth/session.service';
import { EnumRutas } from '../../../../core/config/EnumRutas';
import { mensajeError } from '../../../../core/http/api-error';
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    usuario: ['', [Validators.required, Validators.pattern(/^[^:]+$/)]],
    clave: ['', Validators.required],
  });
  ingresar(): void {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    const { usuario, clave } = this.form.getRawValue();
    this.session
      .iniciar(usuario.trim(), clave)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: () => {
          this.form.controls.clave.reset();
          void this.router.navigate(['/', EnumRutas.Ordenes]);
        },
        error: (error) => {
          this.error.set(mensajeError(error));
          this.form.controls.clave.reset();
        },
      });
  }
}
