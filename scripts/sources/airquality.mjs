export const SOURCE = { id:'airquality', name:'Calidad del aire', unit:'µg/m³ PM2.5',
  source:'OpenAQ', site:'media de estaciones', sourceUrl:'https://openaq.org/',
  url:'https://api.openaq.org/v3/parameters/2/latest?limit=1000' };  // 2 = PM2.5

function median(nums){
  const s = [...nums].sort((a,b)=>a-b);
  const m = Math.floor(s.length/2);
  return s.length % 2 ? s[m] : (s[m-1]+s[m])/2;
}

export function parse(raw){
  const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const results = d.results || [];
  // PM2.5 en µg/m³; descartamos 0 y picos imposibles (sensores erróneos)
  const vals = results.map(r => r.value).filter(v => Number.isFinite(v) && v > 0 && v < 1000);
  if (!vals.length) throw new Error('airquality: sin lecturas válidas');
  const med = median(vals);
  const date = (results.find(r => r.datetime?.utc)?.datetime.utc || '').slice(0,10);
  const ratio = med / 5; // guía anual OMS = 5 µg/m³
  return { unit:'µg/m³ PM2.5', value: String(Math.round(med)), date,
    dir:'up', delta:`${ratio.toFixed(1)}× guía OMS`, history:[Math.round(med)] };
}

export async function fetchRaw(){
  const key = process.env.OPENAQ_KEY;
  if (!key) throw new Error('airquality: falta OPENAQ_KEY');
  const res = await fetch(SOURCE.url, { headers:{ 'X-API-Key':key, 'User-Agent':'bitacora-global' } });
  if (!res.ok) throw new Error(`airquality HTTP ${res.status}`);
  return res.text();
}
