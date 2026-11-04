import { Component, computed, input } from '@angular/core';

const ICONS: Record<string, string> = {
  HYGIENE: '🧴',
  CLOTHING: '👕',
  FEEDING: '🍼',
  FURNITURE: '🛏️',
  BATH: '🛁',
  SLEEP: '🌙',
  TOYS: '🧸',
  HEALTH: '🩺',
  OUTINGS: '🚼',
  OTHER: '🎁',
};

const TINTS = ['var(--c-pink)', 'var(--c-sky)', 'var(--c-mint)', 'var(--c-lavender)', 'var(--c-beige)'];

/** Ilustración de respaldo cuando un regalo no tiene imagen. */
@Component({
  selector: 'app-category-icon',
  template: `<span class="icon" aria-hidden="true" [style.background]="tint()">{{ icon() }}</span>`,
  styles: `
    :host { display: block; }
    .icon { display: grid; place-items: center; width: 100%; height: 100%; font-size: 2.6rem; }
  `,
})
export class CategoryIcon {
  readonly code = input.required<string>();
  protected readonly icon = computed(() => ICONS[this.code()] ?? '🎁');
  protected readonly tint = computed(() => TINTS[Object.keys(ICONS).indexOf(this.code()) % TINTS.length] ?? TINTS[0]);
}
