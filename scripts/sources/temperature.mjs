export const SOURCE = {
  id: 'temperature',
  name: 'Temperatura global',
  unit: '°C',
  source: 'NASA',
  site: 'GISTEMP',
  sourceUrl: 'https://data.giss.nasa.gov/gistemp/',
  url: 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv',
};

export function parse(raw) {
  const JD = 13; // Year,Jan..Dec,J-D  -> J-D at index 13
  const rows = raw
    .split('\n')
    .map(l => l.split(','))
    .filter(c => /^\d{4}$/.test((c[0] || '').trim()))      // only rows starting with a year
    .map(c => ({ year: c[0].trim(), jd: parseFloat(c[JD]) }))
    .filter(r => Number.isFinite(r.jd));                   // discard incomplete years (***)

  const lastNum = rows[rows.length - 1].jd;
  const history = rows.slice(-12).map(r => Math.round(r.jd*100)/100);
  return { unit:'°C', value: `+${lastNum.toFixed(2)}`, date: rows[rows.length-1].year,
    dir:'up', delta:`+${(lastNum - rows[rows.length-11].jd).toFixed(2)} / déc.`, history };
}

export async function fetchRaw() {
  const res = await fetch(SOURCE.url, { headers: { 'User-Agent': 'bitacora-global' } });
  if (!res.ok) throw new Error(`${SOURCE.id} HTTP ${res.status}`);
  return res.text();
}
