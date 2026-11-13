import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { SessionService } from '../../core/auth/session.service';
import { cerrarSesion } from '../../core/auth/session.actions';
import { EnumRutas } from '../../core/config/EnumRutas';
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly oscuro = signal(false);
  readonly menuAbierto = signal(false);
  constructor() {
    const preferencia = localStorage.getItem('subocol-tema');
    this.oscuro.set(
      preferencia ? preferencia === 'oscuro' : matchMedia('(prefers-color-scheme: dark)').matches,
    );
    document.documentElement.dataset['theme'] = this.oscuro() ? 'dark' : 'light';
  }
  cambiarTema(): void {
    this.oscuro.update((valor) => !valor);
    const tema = this.oscuro() ? 'dark' : 'light';
    document.documentElement.dataset['theme'] = tema;
    localStorage.setItem('subocol-tema', this.oscuro() ? 'oscuro' : 'claro');
  }
  readonly rutas = EnumRutas;
  readonly session = inject(SessionService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  salir(): void {
    this.session.limpiar();
    this.store.dispatch(cerrarSesion());
    void this.router.navigate(['/', EnumRutas.Acceso]);
  }
}
