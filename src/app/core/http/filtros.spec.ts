import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FranjasPageComponent } from '../../features/agenda/pages/franjas-page/franjas-page.component';
import { agendaActions, agendaFeature } from '../../features/agenda/state/agenda.state';

describe('Filtros automáticos de franjas', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideStore({ agenda: agendaFeature.reducer }),
      ],
    });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
  it('agrupa escritura rápida y reinicia la paginación al aplicar el último filtro', () => {
    const fixture = TestBed.createComponent(FranjasPageComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    const component = fixture.componentInstance;
    const dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component.asesor = 'a';
    component.filtrosCambiaron();
    vi.advanceTimersByTime(200);
    component.asesor = ' asesor ';
    component.filtrosCambiaron();
    vi.advanceTimersByTime(399);
    expect(dispatch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toMatchObject({
      type: agendaActions.franjasCargar.type,
      filtro: { page: 0, asesor: 'asesor' },
    });
    component.filtrosCambiaron();
    vi.advanceTimersByTime(400);
    expect(dispatch).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('no consulta fechas inválidas y cancela cambios pendientes al salir', () => {
    const fixture = TestBed.createComponent(FranjasPageComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    const component = fixture.componentInstance;
    const dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component.rango.hasta = component.rango.desde;
    component.filtrosCambiaron();
    vi.advanceTimersByTime(400);
    expect(dispatch).not.toHaveBeenCalled();
    expect(component.errorRango()).toBeTruthy();
    component.asesor = 'otro';
    component.filtrosCambiaron();
    fixture.destroy();
    vi.advanceTimersByTime(400);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
