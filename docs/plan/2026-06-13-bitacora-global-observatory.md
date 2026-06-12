# Bitácora Global — Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el prototipo estático de Bitácora Global en un observatorio público y auto-actualizable: 5 signos vitales del planeta con datos reales de fuentes públicas, fechados y verificables, donde el historial de git ES el registro inalterable.

**Architecture:** Sitio 100% estático (HTML/CSS/JS vanilla, sin framework, sin build) que lee `data/vitals.json`. Un pipeline en Node (sin dependencias: `fetch` y `node:test` nativos) baja y normaliza las fuentes públicas y escribe ese JSON. Un GitHub Action diario corre el pipeline y commitea el JSON → cada actualización es un asiento fechado en git (la procedencia). Deploy estático en Netlify free tier.

**Tech Stack:** HTML/CSS/JS vanilla · Node ≥20 (global `fetch`, módulo `node:test`, `node:crypto`) · GitHub Actions · Netlify. **CERO dependencias npm — no hay `node_modules`.**

**Repo:** `/Users/javiercoterillo/bitacora-global` (git ya iniciado, v0 = look). Se publicará en GitHub (cuenta de Javier, `occylupo`) y se conecta a Netlify.

**Spec/diseño:** el look v0 está en `index.html` (aprobado). NO romper la estética (bitácora de observatorio nocturno).

---

## File Structure

**Crear:**
- `styles.css` — extraer el CSS de `index.html` (sin cambios visuales). Una responsabilidad: estética.
- `app.js` — render del frontend leyendo `data/vitals.json` (reemplaza el array mock inline).
- `data/vitals.json` — salida del pipeline (lecturas + historia + sello). Commiteado.
- `data/sources/<id>.sample.txt` — fixtures reales capturados de cada fuente (para tests sin red).
- `scripts/lib/hash.mjs` — sello determinista de un asiento (pure).
- `scripts/lib/hash.test.mjs`
- `scripts/sources/co2.mjs` … `airquality.mjs` — por fuente: `URL`, `parse(raw)` (pure) y `fetchRaw()`.
- `scripts/sources/<id>.test.mjs` — test del `parse` contra el fixture.
- `scripts/build-vitals.mjs` — orquestador: junta las 5 fuentes → `data/vitals.json`.
- `.github/workflows/update-vitals.yml` — cron diario.
- `netlify.toml` — deploy estático.

**Modificar:**
- `index.html` — quitar `<style>` y `<script>` inline; enlazar `styles.css` y `app.js`.

**Contrato de datos (`data/vitals.json`):**
```json
{
  "generatedAt": "2026-06-13T04:00:00Z",
  "vitals": [
    { "id":"co2","name":"Dióxido de carbono","value":429.6,"unit":"ppm",
      "dir":"up","delta":"+2.4 / año","date":"2026-06-11",
      "source":"NOAA","site":"Mauna Loa","sourceUrl":"https://gml.noaa.gov/ccgg/trends/",
      "history":[427.1,427.8,428.3,429.0,429.6],"hash":"a1f3c9" }
  ]
}
```

---

## Milestone 1 — Sitio estático leyendo JSON (sin cambiar el look)

### Task 1.1: Extraer CSS y JS del prototipo a ficheros

**Files:**
- Create: `styles.css`, `app.js`
- Modify: `index.html`

- [ ] **Step 1: Mover el CSS**
Cortar TODO el contenido entre `<style>` y `</style>` de `index.html` a un nuevo `styles.css` (sin tocar una línea). En `index.html`, sustituir el bloque `<style>…</style>` por:
```html
<link rel="stylesheet" href="styles.css" />
```

- [ ] **Step 2: Mover el JS y hacerlo leer el JSON**
Cortar el contenido entre `<script>` y `</script>` a `app.js`. Sustituir el array `ENTRIES` hardcodeado por una carga del JSON, conservando EXACTAMENTE el mismo render (`grid.innerHTML` por entrada). `app.js`:
```js
async function load(){
  const res = await fetch('data/vitals.json', {cache:'no-store'});
  const data = await res.json();
  return data.vitals;
}
function sparkPath(history){
  if(!history || history.length<2) return 'M0,23 L180,23';
  const min=Math.min(...history), max=Math.max(...history), span=(max-min)||1;
  return history.map((v,i)=>{
    const x=(i/(history.length-1))*180;
    const y=40-((v-min)/span)*34;
    return (i?'L':'M')+x.toFixed(1)+','+y.toFixed(1);
  }).join(' ');
}
function render(vitals){
  const grid=document.getElementById('grid');
  grid.innerHTML='';
  vitals.forEach((e,i)=>{
    const up=e.dir==='up';
    const stroke=up?'var(--coral)':'var(--teal)';
    const n=String(i+1).padStart(2,'0');
    const el=document.createElement('article');
    el.className='entry';
    el.style.animationDelay=(0.12*i+0.1).toFixed(2)+'s';
    el.innerHTML=
      '<span class="no">REGISTRO '+n+'</span>'+
      '<div class="name">'+e.name+'</div>'+
      '<div class="reading"><span class="val">'+e.value+'</span><span class="unit">'+e.unit+'</span></div>'+
      '<div class="trend '+e.dir+'"><span class="arrow">'+(up?'▲':'▼')+'</span>'+e.delta+'</div>'+
      '<svg class="spark" viewBox="0 0 180 46" preserveAspectRatio="none">'+
        '<path class="line" d="'+sparkPath(e.history)+'" style="stroke:'+stroke+';animation-delay:'+(0.4+0.12*i).toFixed(2)+'s"/></svg>'+
      '<div class="src"><span class="stamp"><span class="glyph">✕</span>'+e.source+' · '+e.site+'</span>'+
        '<span class="meta"><a href="'+e.sourceUrl+'" target="_blank" rel="noopener">verificar fuente ↗</a><br/>'+
        'actualizado '+e.date+' · <span class="hash">sello '+e.hash+'</span></span></div>';
    grid.appendChild(el);
  });
}
load().then(render).catch(()=>{document.getElementById('grid').innerHTML='<article class="entry">sin datos</article>';});
```
Añadir antes de `</body>` en `index.html`: `<script src="app.js"></script>`.

- [ ] **Step 3: Crear un `data/vitals.json` semilla** (los mismos valores mock de v0, ya en el contrato) con las 5 entradas (co2, temperatura, nivel del mar, hielo, aire), cada una con `history` de 5 puntos y `hash` provisional.

- [ ] **Step 4: Verificar visualmente**
Run: `cd /Users/javiercoterillo/bitacora-global && python3 -m http.server 8000`
Abrir `http://localhost:8000`. Expected: idéntico al v0, pero ahora alimentado por el JSON.

- [ ] **Step 5: Commit**
```bash
git add index.html styles.css app.js data/vitals.json
git commit -m "feat: sitio estático leyendo data/vitals.json (look intacto)"
```

---

## Milestone 2 — Pipeline de datos (sin dependencias, TDD)

### Task 2.1: Sello determinista de un asiento

**Files:**
- Create: `scripts/lib/hash.mjs`, `scripts/lib/hash.test.mjs`

- [ ] **Step 1: Test que falla** (`scripts/lib/hash.test.mjs`)
```js
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
```

- [ ] **Step 2: Correr, debe fallar**
Run: `cd /Users/javiercoterillo/bitacora-global && node --test scripts/lib/`
Expected: FAIL (no existe `seal`).

- [ ] **Step 3: Implementar** (`scripts/lib/hash.mjs`)
```js
import { createHash } from 'node:crypto';
export function seal(id, value, date){
  return createHash('sha256').update(`${id}|${value}|${date}`).digest('hex').slice(0,6);
}
```

- [ ] **Step 4: Correr, debe pasar**
Run: `node --test scripts/lib/`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add scripts/lib/hash.mjs scripts/lib/hash.test.mjs
git commit -m "feat: seal() — sello determinista de un asiento"
```

### Task 2.2 … 2.6: Una fuente por tarea (mismo patrón para co2/temperatura/sealevel/seaice/airquality)

> **Patrón TDD para datos externos** (aplícalo idéntico a cada fuente; aquí desarrollado para CO₂):

**Files (CO₂):**
- Create: `scripts/sources/co2.mjs`, `scripts/sources/co2.test.mjs`, `data/sources/co2.sample.txt`

- [ ] **Step 1: Capturar un fixture real** (confirma URL y formato — NO inventar el formato)
```bash
curl -sL "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv" -o data/sources/co2.sample.txt
head -80 data/sources/co2.sample.txt
```
Observar las columnas reales (el CSV de NOAA trae comentarios con `#` y columnas `year,month,decimal date,average,...`). Si la URL cambió, buscar la vigente en https://gml.noaa.gov/ccgg/trends/data.html y actualizarla.

- [ ] **Step 2: Test que falla** (`scripts/sources/co2.test.mjs`) — contra el fixture, sin red
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from './co2.mjs';

test('parse CO₂ devuelve último valor, fecha y tendencia', () => {
  const raw = readFileSync(new URL('../../data/sources/co2.sample.txt', import.meta.url),'utf8');
  const r = parse(raw);
  assert.equal(r.unit, 'ppm');
  assert.ok(r.value > 400 && r.value < 480);      // sanity range
  assert.match(r.date, /^\d{4}-\d{2}/);
  assert.equal(r.history.length, 12);             // últimos 12 puntos
  assert.equal(r.dir, 'up');
});
```

- [ ] **Step 3: Correr, debe fallar**
Run: `node --test scripts/sources/co2.test.mjs`
Expected: FAIL (no existe `parse`).

- [ ] **Step 4: Implementar** (`scripts/sources/co2.mjs`) — ajustar los índices de columna a lo visto en el fixture en Step 1
```js
export const SOURCE = { id:'co2', name:'Dióxido de carbono', unit:'ppm',
  source:'NOAA', site:'Mauna Loa', sourceUrl:'https://gml.noaa.gov/ccgg/trends/',
  url:'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv' };

export function parse(raw){
  const rows = raw.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.trim().split(/[,\s]+/).map(Number))
    .filter(c => c.length >= 4 && Number.isFinite(c[3]) && c[3] > 0);
  const avg = rows.map(c => c[3]);                 // col 4 = average (ajustar si el fixture difiere)
  const last = rows[rows.length - 1];
  const history = avg.slice(-12).map(v => Math.round(v*10)/10);
  const yr = last[0], mo = String(last[1]).padStart(2,'0');
  const perYear = (avg[avg.length-1] - avg[avg.length-13]); // ~12 meses
  return { unit:'ppm', value: Math.round(last[3]*10)/10, date:`${yr}-${mo}`,
    dir:'up', delta:`+${perYear.toFixed(1)} / año`, history };
}

export async function fetchRaw(){
  const res = await fetch(SOURCE.url, { headers:{'User-Agent':'bitacora-global'} });
  if(!res.ok) throw new Error(`${SOURCE.id} HTTP ${res.status}`);
  return res.text();
}
```

- [ ] **Step 5: Correr, debe pasar**
Run: `node --test scripts/sources/co2.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add scripts/sources/co2.mjs scripts/sources/co2.test.mjs data/sources/co2.sample.txt
git commit -m "feat(source): CO₂ desde NOAA Mauna Loa (parse + fixture test)"
```

**Repetir Task 2.2 con estos parámetros para las otras 4 fuentes** (mismo patrón: capturar fixture → test de rango/forma → parse → pasar → commit). URLs candidatas a confirmar en Step 1:
- **2.3 temperatura** — `temperature.mjs` — NASA GISTEMP `https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv` · unit `°C` · `dir:'up'` · anomalía vs 1951-1980 · history = últimos 12 anuales. Nota: la cabecera real tiene 2 líneas antes de los datos; saltarlas.
- **2.4 sealevel** — `sealevel.mjs` — NASA GMSL (confirmar endpoint en `https://climate.nasa.gov/vital-signs/sea-level/` → fichero de datos) · unit `mm` · `dir:'up'` · valor = última anomalía GMSL en mm.
- **2.5 seaice** — `seaice.mjs` — NSIDC extensión ártica (confirmar CSV en `https://nsidc.org/data/seaice_index` / `https://noaadata.apps.nsidc.org/NOAA/G02135/...`) · unit `M km²` · `dir:'down'` · valor = última extensión.
- **2.6 airquality** — `airquality.mjs` — OpenAQ API v3 `https://api.openaq.org/v3/...` (PM2.5, requiere API key gratis en header `X-API-Key`) · unit `µg/m³ PM2.5` · `dir:'up'`. Si v3 exige key, usar un promedio global de estaciones de referencia; el key va como secret de Actions (`OPENAQ_KEY`), nunca en el repo.

### Task 2.7: Orquestador build-vitals

**Files:**
- Create: `scripts/build-vitals.mjs`

- [ ] **Step 1: Implementar** (sin test unitario; se valida ejecutándolo)
```js
import { writeFileSync } from 'node:fs';
import { seal } from './lib/hash.mjs';
import * as co2 from './sources/co2.mjs';
import * as temperature from './sources/temperature.mjs';
import * as sealevel from './sources/sealevel.mjs';
import * as seaice from './sources/seaice.mjs';
import * as airquality from './sources/airquality.mjs';

const SOURCES = [co2, temperature, sealevel, seaice, airquality];

const vitals = [];
for (const s of SOURCES) {
  try {
    const r = s.parse(await s.fetchRaw());
    vitals.push({ id:s.SOURCE.id, name:s.SOURCE.name, ...r,
      source:s.SOURCE.source, site:s.SOURCE.site, sourceUrl:s.SOURCE.sourceUrl,
      hash: seal(s.SOURCE.id, r.value, r.date) });
    console.log(`✓ ${s.SOURCE.id} ${r.value} ${r.unit}`);
  } catch (e) {
    console.error(`✗ ${s.SOURCE.id}: ${e.message}`); // fail-soft: se omite esta fuente, no se rompe el resto
  }
}
if (!vitals.length) { console.error('sin fuentes'); process.exit(1); }
writeFileSync(new URL('../data/vitals.json', import.meta.url),
  JSON.stringify({ generatedAt:new Date().toISOString(), vitals }, null, 2) + '\n');
console.log(`escrito data/vitals.json (${vitals.length} asientos)`);
```

- [ ] **Step 2: Ejecutar contra fuentes reales**
Run: `node scripts/build-vitals.mjs`
Expected: imprime `✓` por fuente y escribe `data/vitals.json` con valores reales. Abrir el sitio (http.server) y confirmar que el look sigue intacto con datos reales.

- [ ] **Step 3: Commit**
```bash
git add scripts/build-vitals.mjs data/vitals.json
git commit -m "feat: orquestador build-vitals (fail-soft por fuente)"
```

---

## Milestone 3 — Automatización (el registro inalterable) + deploy

### Task 3.1: GitHub Action diario que commitea el JSON

**Files:**
- Create: `.github/workflows/update-vitals.yml`

- [ ] **Step 1: Crear el workflow**
```yaml
name: actualizar signos vitales
on:
  schedule: [{ cron: '0 5 * * *' }]   # 05:00 UTC diario
  workflow_dispatch: {}
permissions: { contents: write }
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node --test scripts/   # los parsers deben pasar antes de publicar
      - run: node scripts/build-vitals.mjs
        env: { OPENAQ_KEY: ${{ secrets.OPENAQ_KEY }} }
      - run: |
          git config user.name "bitácora"
          git config user.email "bot@bitacoraglobal"
          git add data/vitals.json
          git diff --staged --quiet || git commit -m "registro: signos vitales $(date -u +%Y-%m-%d)"
          git push
```

- [ ] **Step 2: Verificación (tras subir a GitHub)**
En GitHub → Actions → "actualizar signos vitales" → Run workflow (manual). Expected: corre los tests, regenera el JSON, y si hay cambios, **commitea** un asiento fechado → ese commit ES la entrada del registro inalterable.

- [ ] **Step 3: Commit**
```bash
git add .github/workflows/update-vitals.yml
git commit -m "ci: registro diario de signos vitales (tests + build + commit)"
```

### Task 3.2: Deploy estático en Netlify

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Config** (sin build — es estático)
```toml
[build]
  publish = "."
  command = ""
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

- [ ] **Step 2: (Javier) Publicar**
1. `gh repo create occylupo/bitacora-global --public --source=. --push` (o crear el repo en GitHub y `git push`).
2. En Netlify: "Add new site → Import from GitHub → bitacora-global". Sin build command, publish `.`.
3. (Opcional) Conectar el dominio `bitacoraglobal.org/.earth` cuando se registre.

- [ ] **Step 3: Commit**
```bash
git add netlify.toml
git commit -m "chore: deploy estático Netlify (cabeceras de seguridad)"
```

---

## Self-Review (cobertura vs diseño)

- Sitio estático con el look v0 intacto → Task 1.1 ✓
- 5 signos vitales con fuentes públicas → Tasks 2.2–2.6 ✓
- Procedencia "sello" → Task 2.1 (`seal`) + mostrado en `app.js` (Task 1.1) ✓
- "Verificar fuente" enlazando al crudo → `sourceUrl` en cada source + `app.js` ✓
- Registro inalterable en git → Task 3.1 (commit diario) ✓
- ~0€/mes, sin node_modules → Node nativo + Actions + Netlify free ✓
- ES + EN → el look ya trae el tagline EN; copy EN completo = mejora posterior (no bloquea v1)

**Riesgos anotados (no placeholders, decisiones explícitas):**
- Las URLs/formel de NASA/NSIDC/OpenAQ se confirman en el Step 1 "capturar fixture" de cada tarea (por eso el fixture va primero) — no se asume el formato a ciegas.
- OpenAQ v3 puede requerir API key gratis → va como secret de Actions, nunca en el repo.
- `fetch`/`node:test` requieren Node ≥20 (el Action fija node 20).
