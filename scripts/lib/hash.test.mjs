import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seal } from './hash.mjs';

test('seal es determinista y de 6 hex', () => {
  const a = seal('co2', 429.6, '2026-06-11');
  assert.match(a, /^[0-9a-f]{6}$/);
  assert.equal(a, seal('co2', 429.6, '2026-06-11'));
});
test('seal cambia si cambia el valor', () => {
  assert.notEqual(seal('co2', 429.6, '2026-06-11'), seal('co2', 430.0, '2026-06-11'));
});
