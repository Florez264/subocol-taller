import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnumApiRutas } from '../config/EnumRutas';
export function basicAuthorization(usuario: string, clave: string): string {
  const bytes = new TextEncoder().encode(`${usuario}:${clave}`);
  return `Basic ${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))}`;
}
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private authorization: string | null = null;
  private readonly nombre = signal('');
  readonly usuario = this.nombre.asReadonly();
  get autenticada(): boolean {
    return this.authorization !== null;
  }
  get header(): string | null {
    return this.authorization;
  }
  iniciar(usuario: string, clave: string) {
    const authorization = basicAuthorization(usuario, clave);
    // Se verifica con un endpoint existente; el backend no implementa tokens de sesión.
    return this.http
      .get(environment.apiOrdenes + EnumApiRutas.OrdenesListar, {
        headers: new HttpHeaders({ Authorization: authorization }),
        params: { page: 0, size: 1 },
      })
      .pipe(
        tap(() => {
          this.authorization = authorization;
          this.nombre.set(usuario);
        }),
      );
  }
  limpiar(): void {
    this.authorization = null;
    this.nombre.set('');
  }
}
