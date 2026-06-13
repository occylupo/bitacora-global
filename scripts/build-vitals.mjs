import { readFileSync, writeFileSync } from 'node:fs';
import { seal } from './lib/hash.mjs';
import * as co2 from './sources/co2.mjs';
import * as methane from './sources/methane.mjs';
import * as temperature from './sources/temperature.mjs';
import * as sealevel from './sources/sealevel.mjs';
import * as seaice from './sources/seaice.mjs';
import * as airquality from './sources/airquality.mjs';

const SOURCES = [co2, methane, temperature, sealevel, seaice, airquality];

const VITALS_PATH = new URL('../data/vitals.json', import.meta.url);
// Asientos del registro anterior: si hoy una fuente cae, conservamos su última lectura.
let prev = {};
try {
  prev = Object.fromEntries(JSON.parse(readFileSync(VITALS_PATH,'utf8')).vitals.map(v => [v.id, v]));
} catch {}

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
    if (prev[s.SOURCE.id]) {
      vitals.push({ ...prev[s.SOURCE.id], stale:true });
      console.log(`• ${s.SOURCE.id}: conservo el último asiento (fuente caída hoy)`);
    }
  }
}

// Aire: si la corrida no tuvo OPENAQ_KEY (o falló), cae a un asiento curado para no dejar hueco.
if (!vitals.find(v => v.id === 'airquality')) {
  const air = { id:'airquality', name:'Calidad del aire', value:'9', unit:'µg/m³ PM2.5',
    dir:'up', delta:'1.8× guía OMS', date:'2026-06', source:'OpenAQ',
    site:'media de estaciones · curado', sourceUrl:'https://openaq.org/', live:false, history:[9] };
  air.hash = seal(air.id, air.value, air.date);
  vitals.push(air);
  console.log('• airquality: curado (sin OPENAQ_KEY)');
}

if (vitals.length < 2) { console.error('sin fuentes'); process.exit(1); }
writeFileSync(new URL('../data/vitals.json', import.meta.url),
  JSON.stringify({ generatedAt:new Date().toISOString(), vitals }, null, 2) + '\n');
console.log(`escrito data/vitals.json (${vitals.length} asientos, ${vitals.filter(v=>v.live).length} en vivo)`);
