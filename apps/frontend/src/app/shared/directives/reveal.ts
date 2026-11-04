import { Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';

/** Animación discreta al entrar en pantalla (respeta prefers-reduced-motion vía CSS). */
@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal' },
})
export class Reveal implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      if (!('IntersectionObserver' in window)) {
        this.el.nativeElement.classList.add('is-visible');
        return;
      }
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              this.observer?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.15 },
      );
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
