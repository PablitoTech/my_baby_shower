import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { GiftCard } from './gift-card';

describe('GiftCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
  });

  it('muestra el nombre, el estado y el progreso de reserva', async () => {
    const fixture = TestBed.createComponent(GiftCard);
    fixture.componentRef.setInput('name', 'Pañales');
    fixture.componentRef.setInput('categoryCode', 'HYGIENE');
    fixture.componentRef.setInput('status', 'PARTIALLY_RESERVED');
    fixture.componentRef.setInput('available', 1);
    fixture.componentRef.setInput('required', 4);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h3')?.textContent).toContain('Pañales');
    expect(el.querySelector('.badge')?.className).toContain('badge-partially_reserved');
    expect((el.querySelector('.bar span') as HTMLElement).style.width).toBe('75%');
  });
});
