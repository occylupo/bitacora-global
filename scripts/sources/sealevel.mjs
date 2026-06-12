export const SOURCE = { id:'sealevel', name:'Nivel del mar', unit:'mm',
  source:'NOAA', site:'altimetría', sourceUrl:'https://climate.nasa.gov/vital-signs/sea-level/',
  url:'https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/slr/slr_sla_gbl_free_all_66.csv' };

export function parse(raw){
  // CSV: year,TOPEX/Poseidon,Jason-1,Jason-2,Jason-3,Sentinel-6MF
  // Each row has decimal year in col 0 and exactly one satellite value in cols 1-5
  const rows = raw.split('\n')
    .map(l => l.trim())
    .filter(l => l && /^\d/.test(l))
    .map(l => {
      const parts = l.split(',');
      const year = Number(parts[0]);
      // find the first finite value among satellite columns (1-5)
      let gmsl = NaN;
      for (let i = 1; i < parts.length; i++) {
        const v = Number(parts[i]);
        if (Number.isFinite(v)) { gmsl = v; break; }
      }
      return { year, gmsl };
    })
    .filter(r => Number.isFinite(r.year) && Number.isFinite(r.gmsl));

  // baseline shift: present rise relative to the first sample (makes value a positive +mm rise)
  const base = rows[0].gmsl;
  const mm = rows.map(r => Math.round((r.gmsl - base) * 10) / 10);
  const lastRow = rows[rows.length - 1];
  const history = mm.slice(-12);
  const yr = Math.floor(lastRow.year);
  const perYear = mm[mm.length - 1] - mm[mm.length - 13];

  return {
    unit: 'mm',
    value: `+${Math.round(mm[mm.length - 1])}`,
    date: `${yr}`,
    dir: 'up',
    delta: `+${perYear.toFixed(1)} / período`,
    history
  };
}

export async function fetchRaw(){
  const res = await fetch(SOURCE.url, { headers:{'User-Agent':'bitacora-global'} });
  if(!res.ok) throw new Error(`${SOURCE.id} HTTP ${res.status}`);
  return res.text();
}
