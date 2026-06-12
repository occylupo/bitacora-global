import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './temperature.mjs';

test('parse temperatura: anomalía actual, history anual, sube', () => {
  const raw = readFileSync(new URL('../../data/sources/temperature.sample.txt', import.meta.url),'utf8');
  const r = parse(raw);
  assert.equal(r.unit, '°C');
  assert.ok(r.value > 0.8 && r.value < 2.2, `value ${r.value} fuera de rango`);
  assert.equal(r.history.length, 12);
  assert.equal(r.dir, 'up');
  assert.match(r.date, /^\d{4}/);
});
