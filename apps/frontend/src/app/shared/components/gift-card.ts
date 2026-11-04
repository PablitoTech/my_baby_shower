import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { GiftStatus } from '@mbs/contracts';
import { CategoryIcon } from './category-icon';
import { StatusBadge } from './status-badge';

/** Tarjeta de regalo reutilizada en la gestión privada y en la página pública. */
@Component({
  selector: 'app-gift-card',
  imports: [TranslatePipe, CategoryIcon, StatusBadge],
  template: `
    <article class="gift" [class.done]="status() === 'RESERVED'">
      <div class="media">
        @if (imageUrl(); as src) {
          <img [src]="src" [alt]="'gifts.imageAlt' | translate: { name: name() }" loading="lazy" />
        } @else {
          <app-category-icon [code]="categoryCode()" />
        }
        <span class="category">{{ 'categories.' + categoryCode() | translate }}</span>
      </div>
      <div class="body">
        <div class="title-row">
          <h3>{{ name() }}</h3>
          <app-status-badge [status]="status()" />
        </div>
        @if (description()) {
          <p class="description">{{ description() }}</p>
        }
        <div class="qty">
          <div class="bar" aria-hidden="true"><span [style.width.%]="percent()"></span></div>
          <small>{{ 'gifts.quantityInfo' | translate: { available: available(), required: required() } }}</small>
        </div>
        <div class="actions"><ng-content /></div>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; }
    .gift {
      display: flex; flex-direction: column; height: 100%; overflow: hidden; border-radius: var(--radius);
      background: #fff; border: 1px solid var(--c-line); box-shadow: var(--shadow-sm);
      transition: transform .25s var(--ease), box-shadow .25s var(--ease);
      &:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
      &.done .media { filter: saturate(.6); opacity: .85; }
    }
    .media { position: relative; aspect-ratio: 16 / 10; background: var(--c-beige); }
    .media img, .media app-category-icon { width: 100%; height: 100%; object-fit: cover; }
    .category {
      position: absolute; left: .75rem; top: .75rem; padding: .2rem .65rem; border-radius: 999px;
      background: rgb(255 255 255 / 90%); font-size: .78rem; font-weight: 700;
    }
    .body { display: flex; flex-direction: column; gap: .6rem; flex: 1; padding: 1rem 1.1rem 1.1rem; }
    .title-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: .4rem .5rem; }
    h3 { flex: 1 1 9rem; min-width: 0; font-size: 1.08rem; margin: 0; overflow-wrap: break-word; hyphens: auto; }
    .description { margin: 0; color: var(--c-ink-soft); font-size: .92rem; overflow-wrap: anywhere; }
    .qty small { color: var(--c-ink-soft); font-weight: 600; }
    .bar { height: 8px; margin-bottom: .3rem; border-radius: 999px; background: var(--c-mint); overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--c-lavender-deep); border-radius: inherit; transition: width .6s var(--ease); }
    .actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: auto; padding-top: .4rem; }
    .actions:empty { display: none; }
  `,
})
export class GiftCard {
  readonly name = input.required<string>();
  readonly description = input<string | null>(null);
  readonly categoryCode = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly status = input.required<GiftStatus>();
  readonly available = input.required<number>();
  readonly required = input.required<number>();

  /** Porcentaje reservado. */
  protected readonly percent = computed(() =>
    this.required() > 0 ? Math.round(((this.required() - this.available()) / this.required()) * 100) : 0,
  );
}
