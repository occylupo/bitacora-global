import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './co2.mjs';

test('parse CO₂ devuelve último valor, fecha y tendencia', () => {
  const raw = readFileSync(new URL('../../data/sources/co2.sample.txt', import.meta.url),'utf8');
  const r = parse(raw);
  assert.equal(r.unit, 'ppm');
  assert.ok(r.value > 400 && r.value < 480, `value ${r.value} fuera de rango`);
  assert.match(r.date, /^\d{4}-\d{2}/);
  assert.equal(r.history.length, 12);
  assert.equal(r.dir, 'up');
});
