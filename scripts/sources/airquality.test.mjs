import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './airquality.mjs';

test('parse aire: mediana PM2.5 creíble desde el fixture OpenAQ', () => {
  const raw = readFileSync(new URL('../../data/sources/airquality.sample.json', import.meta.url), 'utf8');
  const r = parse(raw);
  assert.equal(r.unit, 'µg/m³ PM2.5');
  assert.equal(typeof r.value, 'string');
  const v = parseFloat(r.value);
  assert.ok(v > 2 && v < 80, `mediana ${v} fuera de rango creíble`);
  assert.equal(r.dir, 'up');
  assert.match(r.date, /^\d{4}-\d{2}/);
  assert.match(r.delta, /OMS/);
});
