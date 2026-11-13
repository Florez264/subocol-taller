import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnumRutas, rutaDetalleOrden } from '../../../../core/config/EnumRutas';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenesFacade } from '../../state/ordenes.facade';
import { ESTADOS_ORDEN, EstadoOrden } from '../../models/orden';
@Component({
  selector: 'app-ordenes-page',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './ordenes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesPageComponent implements OnInit {
  readonly rutas = EnumRutas;
  readonly detalle = rutaDetalleOrden;
  readonly facade = inject(OrdenesFacade);
  readonly estados = ESTADOS_ORDEN;
  placa = '';
  estado: EstadoOrden | '' = '';
  page = 0;
  ngOnInit(): void {
    this.cargar(0);
  }
  cargar(page = 0): void {
    this.page = page;
    this.facade.cargar({ page, placa: this.placa, estado: this.estado });
  }
  etiqueta(estado: string): string {
    return estado.replaceAll('_', ' ');
  }
}
