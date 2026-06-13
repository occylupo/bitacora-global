export const SOURCE = { id:'methane', name:'Metano', unit:'ppb',
  source:'NOAA', site:'global', sourceUrl:'https://gml.noaa.gov/ccgg/trends_ch4/',
  url:'https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_mm_gl.csv' };

export function parse(raw){
  const rows = raw.split('\n')
    .filter(l => l && !l.startsWith('#') && !l.startsWith('year'))
    .map(l => l.trim().split(/[,\s]+/).map(Number))
    .filter(c => c.length >= 4 && Number.isFinite(c[3]) && c[3] > 0);
  const avg = rows.map(c => c[3]);            // col 3 = media global mensual
  const last = rows[rows.length - 1];
  const history = avg.slice(-12).map(v => Math.round(v*10)/10);
  const yr = last[0], mo = String(last[1]).padStart(2,'0');
  const perYear = avg[avg.length-1] - avg[avg.length-13];
  return { unit:'ppb', value: Math.round(last[3]*10)/10, date:`${yr}-${mo}`,
    dir:'up', delta:`+${Math.round(perYear)} / año`, history };
}

export async function fetchRaw(){
  const res = await fetch(SOURCE.url, { headers:{'User-Agent':'bitacora-global'} });
  if(!res.ok) throw new Error(`${SOURCE.id} HTTP ${res.status}`);
  return res.text();
}
