export const SOURCE = {
  id: 'seaice',
  name: 'Hielo marino ártico',
  unit: 'M km²',
  source: 'NSIDC',
  site: 'extensión',
  sourceUrl: 'https://nsidc.org/arcticseaicenews/',
  url: 'https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv',
};

const Y = 0, M = 1, D = 2, EXT = 3;

export function parse(raw) {
  const rows = raw.split('\n')
    // Split only on first 5 commas to avoid splitting the quoted Source Data array
    .map(line => {
      const cols = [];
      let remaining = line;
      for (let i = 0; i < 5; i++) {
        const idx = remaining.indexOf(',');
        if (idx === -1) { cols.push(remaining); break; }
        cols.push(remaining.slice(0, idx));
        remaining = remaining.slice(idx + 1);
      }
      return cols.map(s => s.trim());
    })
    .filter(c => /^\d{4}$/.test(c[Y]) && Number.isFinite(parseFloat(c[EXT])) && parseFloat(c[EXT]) > 0)
    .map(c => ({ y: +c[Y], m: +c[M], d: +c[D], ext: parseFloat(c[EXT]) }));

  const last = rows[rows.length - 1];
  const history = rows.slice(-12).map(r => Math.round(r.ext * 100) / 100);

  // delta honesto: % por debajo de la media de ese mismo mes en todo el registro
  const sameMonth = rows.filter(r => r.m === last.m).map(r => r.ext);
  const mean = sameMonth.reduce((a, b) => a + b, 0) / sameMonth.length;
  const pct = Math.round((1 - last.ext / mean) * 100);

  return {
    unit: 'M km²',
    value: (Math.round(last.ext * 10) / 10).toFixed(1),
    date: `${last.y}-${String(last.m).padStart(2, '0')}`,
    dir: 'down',
    delta: `${pct >= 0 ? '−' : '+'}${Math.abs(pct)}% vs media`,
    history,
  };
}

export async function fetchRaw() {
  const res = await fetch(SOURCE.url, { headers: { 'User-Agent': 'bitacora-global' } });
  if (!res.ok) throw new Error(`${SOURCE.id} HTTP ${res.status}`);
  return res.text();
}
