import { writeFileSync } from 'node:fs';
import { seal } from './lib/hash.mjs';
import * as co2 from './sources/co2.mjs';
import * as temperature from './sources/temperature.mjs';
import * as sealevel from './sources/sealevel.mjs';
import * as seaice from './sources/seaice.mjs';

const SOURCES = [co2, temperature, sealevel, seaice];

const vitals = [];
for (const s of SOURCES) {
  try {
    const r = s.parse(await s.fetchRaw());
    vitals.push({ id:s.SOURCE.id, name:s.SOURCE.name, ...r,
      source:s.SOURCE.source, site:s.SOURCE.site, sourceUrl:s.SOURCE.sourceUrl,
      live:true, hash: seal(s.SOURCE.id, r.value, r.date) });
    console.log(`✓ ${s.SOURCE.id} ${r.value} ${r.unit}`);
  } catch (e) {
    console.error(`✗ ${s.SOURCE.id}: ${e.message}`);
  }
}

// Aire: pendiente de clave OpenAQ (free). Asiento curado hasta que se cablee en vivo.
const air = { id:'airquality', name:'Calidad del aire', value:'31', unit:'µg/m³ PM2.5',
  dir:'up', delta:'+4 vs OMS', date:'2026-06', source:'OpenAQ', site:'global · curado',
  sourceUrl:'https://openaq.org/', live:false, history:[27,29,28,30,31] };
air.hash = seal(air.id, air.value, air.date);
vitals.push(air);

if (vitals.length < 2) { console.error('sin fuentes'); process.exit(1); }
writeFileSync(new URL('../data/vitals.json', import.meta.url),
  JSON.stringify({ generatedAt:new Date().toISOString(), vitals }, null, 2) + '\n');
console.log(`escrito data/vitals.json (${vitals.length} asientos, ${vitals.filter(v=>v.live).length} en vivo)`);
