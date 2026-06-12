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
