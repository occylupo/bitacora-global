import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './temperature.mjs';

test('parse temperatura: anomalía actual, history anual, sube', () => {
  const raw = readFileSync(new URL('../../data/sources/temperature.sample.txt', import.meta.url),'utf8');
  const r = parse(raw);
  assert.equal(r.unit, '°C');
  assert.equal(typeof r.value, 'string');
  assert.match(r.value, /^\+\d/);
  const latest = r.history[r.history.length-1];
  assert.ok(latest > 0.8 && latest < 2.2, `history latest ${latest} fuera de rango`);
  assert.equal(r.history.length, 12);
  assert.equal(r.dir, 'up');
  assert.match(r.date, /^\d{4}/);
});
