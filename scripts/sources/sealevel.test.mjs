import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './sealevel.mjs';
test('parse nivel del mar: value +mm, history numérica, sube', () => {
  const raw = readFileSync(new URL('../../data/sources/sealevel.sample.txt', import.meta.url),'utf8');
  const r = parse(raw);
  assert.equal(r.unit, 'mm');
  assert.equal(typeof r.value, 'string');
  assert.match(r.value, /^\+\d/);
  assert.equal(r.history.length, 12);
  const latest = r.history[r.history.length-1];
  assert.ok(Number.isFinite(latest), 'history latest debe ser número');
  assert.equal(r.dir, 'up');
});
