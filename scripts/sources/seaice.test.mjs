import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './seaice.mjs';

test('parse hielo: value M km² creíble, history numérica, baja', () => {
  const raw = readFileSync(new URL('../../data/sources/seaice.sample.txt', import.meta.url),'utf8');
  const r = parse(raw);
  assert.equal(r.unit, 'M km²');
  assert.equal(typeof r.value, 'string');
  const v = parseFloat(r.value);
  assert.ok(v > 2 && v < 17, `extensión ${v} fuera de rango realista`);
  assert.equal(r.history.length, 12);
  assert.equal(r.dir, 'down');
});
