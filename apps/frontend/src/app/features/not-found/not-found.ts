import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="container empty-state fade-up">
      <img src="images/empty.svg" alt="" width="160" height="128" />
      <h1>{{ 'notFound.title' | translate }}</h1>
      <p>{{ 'notFound.text' | translate }}</p>
      <a class="btn btn-primary" routerLink="/">{{ 'notFound.home' | translate }}</a>
    </section>
  `,
  styles: `section { padding-block: 5rem; }`,
})
export class NotFoundPage {}
