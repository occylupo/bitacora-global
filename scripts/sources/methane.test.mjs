import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './methane.mjs';

test('parse CH₄ devuelve último valor, fecha y tendencia', () => {
  const raw = readFileSync(new URL('../../data/sources/methane.sample.txt', import.meta.url), 'utf8');
  const r = parse(raw);
  assert.equal(r.unit, 'ppb');
  assert.ok(r.value > 1700 && r.value < 2100, `value ${r.value} fuera de rango`);
  assert.match(r.date, /^\d{4}-\d{2}/);
  assert.equal(r.history.length, 12);
  assert.equal(r.dir, 'up');
});
