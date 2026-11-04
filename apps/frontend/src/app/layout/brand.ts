import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  imports: [RouterLink],
  template: `
    <a class="brand" [routerLink]="link()">
      <img src="images/logo.svg" alt="" width="40" height="40" />
      <span>My <b>Baby</b> Shower</span>
    </a>
  `,
  styles: `
    .brand { display: inline-flex; align-items: center; gap: .55rem; text-decoration: none; color: var(--c-ink); }
    span { font: 600 1.15rem var(--font-display); letter-spacing: -.01em; }
    b { color: var(--c-pink-deep); font-weight: 600; }
  `,
})
export class Brand {
  readonly link = input<string>('/');
}
