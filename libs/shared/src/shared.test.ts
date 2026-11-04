import { test } from 'vitest';
import assert from 'node:assert/strict';
import { computeGiftStatus, availableQuantity } from './gift-status';
import { canTransitionReservation } from './reservation-status';
import { slugify } from './slug';

test('computeGiftStatus', () => {
  assert.equal(computeGiftStatus(3, 0), 'AVAILABLE');
  assert.equal(computeGiftStatus(3, 1), 'PARTIALLY_RESERVED');
  assert.equal(computeGiftStatus(3, 3), 'RESERVED');
});

test('availableQuantity nunca es negativa', () => {
  assert.equal(availableQuantity(2, 5), 0);
  assert.equal(availableQuantity(5, 2), 3);
});

test('transiciones de reserva', () => {
  assert.ok(canTransitionReservation('CONFIRMED', 'DELIVERED'));
  assert.ok(canTransitionReservation('CONFIRMED', 'CANCELLED'));
  assert.ok(!canTransitionReservation('DELIVERED', 'CANCELLED'));
  assert.ok(!canTransitionReservation('CANCELLED', 'DELIVERED'));
  assert.ok(!canTransitionReservation('CANCELLED', 'CONFIRMED'));
});

test('slugify', () => {
  assert.equal(slugify('Sofía Martínez'), 'sofia-martinez');
  assert.equal(slugify('¡¡!!'), 'baby-shower');
});
