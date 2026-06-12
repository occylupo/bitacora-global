export const SOURCE = { id:'co2', name:'Dióxido de carbono', unit:'ppm',
  source:'NOAA', site:'Mauna Loa', sourceUrl:'https://gml.noaa.gov/ccgg/trends/',
  url:'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv' };

export function parse(raw){
  const rows = raw.split('\n')
    .filter(l => l && !l.startsWith('#') && !l.startsWith('"'))
    .map(l => l.trim().split(/[,\s]+/).map(Number))
    .filter(c => c.length >= 4 && Number.isFinite(c[3]) && c[3] > 0);
  const COL = 3; // average column index (year,month,decimal date,average,...)
  const avg = rows.map(c => c[COL]);
  const last = rows[rows.length - 1];
  const history = avg.slice(-12).map(v => Math.round(v*10)/10);
  const yr = last[0], mo = String(last[1]).padStart(2,'0');
  const perYear = avg[avg.length-1] - avg[avg.length-13];
  return { unit:'ppm', value: Math.round(last[COL]*10)/10, date:`${yr}-${mo}`,
    dir:'up', delta:`+${perYear.toFixed(1)} / año`, history };
}

export async function fetchRaw(){
  const res = await fetch(SOURCE.url, { headers:{'User-Agent':'bitacora-global'} });
  if(!res.ok) throw new Error(`${SOURCE.id} HTTP ${res.status}`);
  return res.text();
}
